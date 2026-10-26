import { randomInt, randomUUID } from "node:crypto";
import { db } from "../config/database.ts";
import { env } from "../config/env.ts";
import { HttpError } from "../middlewares/error.middleware.ts";
import { createNotification } from "./notification.service.ts";
import { getOrCreateUser } from "./user.service.ts";
import { saleBoundary, validateAttendees } from "./event-registration.ts";
import type { PaymentCheckoutMethod } from "./payment-provider.ts";
import { paymentService } from "./payment.service.ts";
export interface CreateOrderInput {
  uid: string;
  email?: string;
  eventId: string;
  tierId: string;
  tierName?: string;
  quantity: number;
  selectedDate?: string;
  selectedTime?: string;
  paymentTxnId?: string;
  paymentMethod?: PaymentCheckoutMethod;
  freeOnly?: boolean;
  couponCode?: string;
  attendees?: Array<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    customAnswers?: Record<string, string | string[]>;
  }>;
}
export async function listOrders(uid: string) {
  return db.order.findMany({
    where: { user: { authId: uid } },
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      payments: {
        orderBy: { createdAt: "desc" },
        include: {
          refunds: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });
}

export async function requestOrderRefund(uid: string, orderId: string, reason?: string) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, user: { authId: uid } },
      include: {
        user: true,
        items: true,
        event: { include: { organizer: { include: { user: true } } } },
        payments: {
          orderBy: { createdAt: "desc" },
          include: { refunds: { orderBy: { createdAt: "desc" } } },
        },
      },
    });
    if (!order) throw new HttpError(404, "Ticket order not found");
    if (order.status === "cancelled" || order.status === "refunded")
      throw new HttpError(409, "This ticket order has already been refunded or cancelled");
    if (order.status !== "confirmed")
      throw new HttpError(409, "Only confirmed ticket orders can be refunded");
    if (order.items.some((item) => item.status === "checked_in"))
      throw new HttpError(409, "Checked-in tickets cannot be refunded");
    if (order.event.allowRefunds === false)
      throw new HttpError(409, "The organizer does not allow refunds for this event");

    const refundReason =
      reason?.trim() || "Customer requested refund from Ticket Dashboard";

    let payment =
      order.payments.find((p) => p.state === "completed") ?? order.payments[0] ?? null;

    if (!payment && order.totalKip > 0) {
      payment = await tx.payment.create({
        data: {
          orderId: order.id,
          provider: "phajay",
          amountKip: order.totalKip,
          currency: "LAK",
          state: "completed",
          verifiedAt: order.paidAt ?? new Date(),
        },
        include: { refunds: true },
      });
    } else if (payment && payment.state !== "completed" && order.status === "confirmed") {
      payment = await tx.payment.update({
        where: { id: payment.id },
        data: { state: "completed", verifiedAt: payment.verifiedAt ?? order.paidAt ?? new Date() },
        include: { refunds: true },
      });
    }

    if (payment) {
      await tx.$queryRaw`SELECT id FROM "Payment" WHERE id = ${payment.id}::uuid FOR UPDATE`;
      const existingActive = await tx.refund.findFirst({
        where: {
          paymentId: payment.id,
          status: { in: ["pending_approval", "approved", "processing", "succeeded"] },
        },
        orderBy: { createdAt: "desc" },
      });
      if (existingActive) {
        return { order, refund: existingActive };
      }

      const refund = await tx.refund.create({
        data: {
          paymentId: payment.id,
          amountKip: payment.amountKip,
          currency: payment.currency,
          reason: refundReason,
          status: "pending_approval",
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: order.user.id,
          action: "refund.requested",
          entityType: "Refund",
          entityId: refund.id,
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            amountKip: refund.amountKip,
          },
        },
      });

      await createNotification(
        uid,
        {
          type: "ticket",
          title: "Refund request submitted",
          titleLo: "ສົ່ງຄຳຮ້ອງຂໍຄືນເງິນສຳເລັດ",
          message: `Your refund request for ${order.eventTitle} (${order.orderNumber}) has been submitted.`,
          messageLo: `ຄຳຮ້ອງຂໍຄືນເງິນສຳລັບ ${order.eventTitle} (${order.orderNumber}) ຖືກສົ່ງແລ້ວ.`,
          data: { orderId: order.id, refundId: refund.id },
        },
        tx,
      );

      const admins = await tx.user.findMany({
        where: { role: "admin" },
        select: { authId: true },
      });
      for (const admin of admins) {
        await createNotification(
          admin.authId,
          {
            type: "noted",
            title: "New ticket refund request",
            titleLo: "ມີຄຳຮ້ອງຂໍຄືນເງິນປີ້ໃໝ່",
            message: `${order.orderNumber} requested a refund for ${order.eventTitle}.`,
            messageLo: `ຄຳສັ່ງຊື້ ${order.orderNumber} ຂໍຄືນເງິນສຳລັບງານ ${order.eventTitle}.`,
            data: { orderId: order.id, refundId: refund.id },
          },
          tx,
        );
      }

      return { order, refund };
    }

    // Free ticket order (0 LAK): cancel/refund immediately and return stock.
    const quantities = new Map<string, number>();
    for (const item of order.items) {
      quantities.set(item.tierId, (quantities.get(item.tierId) ?? 0) + 1);
    }
    for (const [tierId, quantity] of quantities) {
      await tx.ticketTier.update({
        where: { id: tierId },
        data: { quantitySold: { decrement: quantity } },
      });
    }
    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: { status: "refunded" },
    });
    await tx.orderItem.updateMany({
      where: { orderId: order.id },
      data: { status: "refunded" },
    });
    await tx.auditLog.create({
      data: {
        actorId: order.user.id,
        action: "order.free_refunded",
        entityType: "Order",
        entityId: order.id,
        metadata: { orderNumber: order.orderNumber },
      },
    });
    return { order: updatedOrder, refund: null };
  });
}
export async function createOrder(input: CreateOrderInput) {
  if (input.paymentTxnId)
    throw new HttpError(400, "Payment references must be created by the server");
  const user = await getOrCreateUser(input.uid, input.email);
  const result = await db.$transaction(async (tx) => {
    const event = await tx.event.findFirst({
      where: /^[0-9a-f-]{36}$/i.test(input.eventId)
        ? { id: input.eventId }
        : { slug: input.eventId },
      include: { organizer: { include: { user: true } }, privateDetails: true },
    });
    if (!event) throw new HttpError(404, "Event not found");
    // Share the event lock with moderation so a cancellation cannot miss a new order.
    const [locked] = await tx.$queryRaw<
      Array<{ status: string }>
    >`SELECT status FROM "Event" WHERE id = ${event.id}::uuid FOR UPDATE`;
    if (locked?.status !== "published")
      throw new HttpError(409, "Tickets are not on sale for this event");
    // Tier identifiers are canonical UUIDs; names are not purchase identifiers.
    if (!/^[0-9a-f-]{36}$/i.test(input.tierId)) throw new HttpError(404, "Ticket type not found");
    const tier = await tx.ticketTier.findFirst({
      where: { id: input.tierId, eventId: event.id, isActive: true },
    });
    if (!tier) throw new HttpError(404, "Ticket type not found");
    const qty = input.quantity;
    if (!Number.isSafeInteger(qty) || qty < 1) throw new HttpError(400, "Invalid quantity");
    let selectedDate = input.selectedDate;
    if (event.dateType === "booking") {
      const date = input.selectedDate?.slice(0, 10);
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !input.selectedTime)
        throw new HttpError(422, "Select a valid booking date and time");
      const bookingDate = await tx.eventDate.findFirst({
        where: {
          eventId: event.id,
          date: new Date(`${date}T00:00:00Z`),
        },
      });
      if (
        !bookingDate ||
        !Array.isArray(bookingDate.timeSlots) ||
        !bookingDate.timeSlots.includes(input.selectedTime)
      )
        throw new HttpError(422, "The selected booking session is unavailable");
      const capacities = event.privateDetails?.bookingSlotCapacities;
      const capacity =
        capacities && typeof capacities === "object" && !Array.isArray(capacities)
          ? capacities[input.selectedTime]
          : null;
      const limit = typeof capacity === "number" ? capacity : bookingDate.capacity;
      if (limit != null) {
        const reserved = await tx.orderItem.count({
          where: {
            status: { in: ["valid", "checked_in", "pending"] },
            order: {
              eventId: event.id,
              selectedDate: { in: [date, `${date}T00:00:00.000Z`, input.selectedDate!] },
              selectedTime: input.selectedTime,
              OR: [{ status: "confirmed" }, { status: "pending", expiresAt: { gt: new Date() } }],
            },
          },
        });
        if (reserved + qty > limit) throw new HttpError(409, "This booking session is full");
      }
      selectedDate = date;
    }
    const attendees = validateAttendees(
      event.privateDetails?.attendeeQuestions,
      event.requireEveryTicketInfo,
      qty,
      input.attendees,
    );
    const windows = event.privateDetails?.ticketSaleWindows;
    const window = Array.isArray(windows) ? windows[tier.sortOrder] : null;
    if (window && typeof window === "object" && !Array.isArray(window)) {
      const starts = saleBoundary(window.saleStartDate, window.saleStartTime, false);
      const ends = saleBoundary(window.saleEndDate, window.saleEndTime, true);
      if ((starts && starts > new Date()) || (ends && ends < new Date()))
        throw new HttpError(409, "Tickets are outside their sale window");
    }
    if (
      (tier.perOrderLimit && qty > tier.perOrderLimit) ||
      (event.maxTicketsPerOrder && qty > event.maxTicketsPerOrder)
    )
      throw new HttpError(422, "Per-order ticket limit exceeded");
    const subtotal = tier.priceKip * qty;
    if (!Number.isSafeInteger(subtotal) || subtotal > 2147483647)
      throw new HttpError(422, "Order amount exceeds supported limit");
    let discount = 0;
    let couponCode: string | undefined;
    if (input.couponCode) {
      const now = new Date();
      const coupon = await tx.coupon.findFirst({
        where: {
          eventId: event.id,
          code: { equals: input.couponCode.trim(), mode: "insensitive" },
        },
      });
      if (
        !coupon ||
        !coupon.isActive ||
        (coupon.startsAt && coupon.startsAt > now) ||
        (coupon.expiresAt && coupon.expiresAt < now)
      )
        throw new HttpError(422, "Invalid or expired coupon");
      // The event row lock serializes coupon usage and stock reservations together.
      const usedWhere = {
        eventId: event.id,
        couponCode: coupon.code,
        OR: [
          { status: { in: ["confirmed", "refunded"] as ("confirmed" | "refunded")[] } },
          { status: "pending" as const, expiresAt: { gt: now } },
        ],
      };
      const [uses, userUses] = await Promise.all([
        tx.order.count({ where: usedWhere }),
        tx.order.count({ where: { ...usedWhere, userId: user.id } }),
      ]);
      if (
        (coupon.maxRedemptions != null && uses >= coupon.maxRedemptions) ||
        (coupon.maxUsesPerUser != null && userUses >= coupon.maxUsesPerUser)
      )
        throw new HttpError(422, "Coupon usage limit reached");
      discount =
        coupon.discountType === "percent"
          ? Math.floor((subtotal * Math.min(coupon.discountValue, 100)) / 100)
          : coupon.discountValue;
      discount = Math.min(subtotal, discount, coupon.maxDiscountAmount ?? subtotal);
      couponCode = coupon.code;
    }
    const total = subtotal - discount;
    if (input.freeOnly && total !== 0)
      throw new HttpError(409, "This ticket requires a payment provider");
    if (
      total > 0 &&
      !paymentService.getReadiness().checkoutEnabled &&
      (!env.isTest || Boolean(input.paymentMethod))
    )
      throw new HttpError(503, "Paid ticket checkout is temporarily unavailable");
    const changed =
      await tx.$executeRaw`UPDATE "TicketTier" SET "quantitySold" = "quantitySold" + ${qty} WHERE id = ${tier.id}::uuid AND ("quantityTotal" IS NULL OR "quantitySold" + ${qty} <= "quantityTotal")`;
    if (!changed) throw new HttpError(409, "Not enough tickets left");
    const paid = total === 0;
    // Use one database clock for both reservation and expiry (application hosts may drift).
    const [clock] = await tx.$queryRaw<
      Array<{ expiresAt: Date }>
    >`SELECT now() + interval '15 minutes' AS "expiresAt"`;
    const orderNumber = `PSK${randomInt(100_000_000_000, 1_000_000_000_000)}`;
    const ticketPrefix = `PSK-${orderNumber.replace(/^PSK-?/, "")}`;
    const order = await tx.order.create({
      data: {
        orderNumber,
        userId: user.id,
        eventId: event.id,
        eventTitle: event.title,
        status: paid ? "confirmed" : "pending",
        subtotalKip: subtotal,
        discountKip: discount,
        couponCode,
        totalKip: total,
        expiresAt: clock.expiresAt,
        paidAt: paid ? new Date() : null,
        buyerEmail: input.email,
        selectedDate,
        selectedTime: input.selectedTime,
        items: {
          create: Array.from({ length: qty }, (_, i) => {
            const a = attendees[i];
            return {
              tierId: tier.id,
              tierName: tier.name,
              unitPriceKip: tier.priceKip,
              ticketCode: ticketPrefix + "-" + (i + 1) + "-" + randomUUID(),
              status: paid ? ("valid" as const) : ("pending" as const),
              attendeeName: [a?.firstName, a?.lastName].filter(Boolean).join(" ") || null,
              attendeeEmail: a?.email,
              attendeePhone: a?.phone,
              customAnswers: a?.customAnswers,
            };
          }),
        },
        ...(paid
          ? {}
          : {
              payments: {
                create: {
                  provider: "phajay",
                  amountKip: total,
                  currency: "LAK",
                },
              },
            }),
      },
      include: { items: true },
    });
    await createNotification(
      input.uid,
      {
        type: "ticket",
        title: paid ? "Ticket confirmed" : "Awaiting payment",
        message: event.title,
        data: { eventId: event.id, orderId: order.id },
      },
      tx,
    );
    if (paid && event.organizer.user.authId !== input.uid)
      await createNotification(
        event.organizer.user.authId,
        {
          type: "ticket",
          title: "New ticket order",
          message: event.title,
          data: { orderId: order.id },
        },
        tx,
      );
    const { items, ...row } = order;
    return {
      order: row,
      items,
      organizerUid:
        paid && event.organizer.user.authId !== input.uid ? event.organizer.user.authId : null,
    };
  });
  if (
    result.order.totalKip === 0 ||
    (!paymentService.getReadiness().checkoutEnabled && env.isTest && !input.paymentMethod)
  )
    return { ...result, checkout: null };
  try {
    const checkout = await paymentService.createCheckoutForOrder(
      result.order.id,
      input.paymentMethod,
    );
    return { ...result, checkout };
  } catch (error) {
    // Release the reservation if checkout creation fails. A delayed provider
    // callback is still handled as a late payment and queued for refund.
    await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: result.order.id } });
      if (!order || order.status !== "pending") return;
      const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
      const quantities = new Map<string, number>();
      for (const item of items) quantities.set(item.tierId, (quantities.get(item.tierId) ?? 0) + 1);
      for (const [tierId, quantity] of quantities)
        await tx.ticketTier.update({
          where: { id: tierId },
          data: { quantitySold: { decrement: quantity } },
        });
      await tx.order.update({ where: { id: order.id }, data: { status: "cancelled" } });
      await tx.orderItem.updateMany({ where: { orderId: order.id }, data: { status: "void" } });
      await tx.payment.updateMany({ where: { orderId: order.id }, data: { state: "failed" } });
    });
    throw error;
  }
}
export async function releaseExpiredOrders() {
  return db.$transaction(async (tx) => {
    const expired = await tx.$queryRaw<
      Array<{ id: string }>
    >`UPDATE "Order" SET status = 'cancelled', "updatedAt" = now() WHERE status = 'pending' AND "expiresAt" <= now() RETURNING id`;
    for (const { id } of expired) {
      const items = await tx.orderItem.findMany({ where: { orderId: id } });
      const quantities = new Map<string, number>();
      for (const item of items) quantities.set(item.tierId, (quantities.get(item.tierId) ?? 0) + 1);
      for (const [tierId, quantity] of quantities)
        await tx.ticketTier.update({
          where: { id: tierId },
          data: { quantitySold: { decrement: quantity } },
        });
      await tx.orderItem.updateMany({ where: { orderId: id }, data: { status: "void" } });
      await tx.auditLog.create({
        data: { action: "order.expired", entityType: "Order", entityId: id },
      });
    }
    return expired.length;
  });
}
