import { db } from "../config/database.ts";
import { HttpError } from "../middlewares/error.middleware.ts";
import { getOrCreateUser } from "./user.service.ts";
import { requireVerifiedPhone } from "./verified-phone.service.ts";
import { createNotification } from "./notification.service.ts";

export async function applyAsOrganizer(uid: string, name: string, description?: string) {
  const phone = await requireVerifiedPhone(uid);
  const user = await getOrCreateUser(uid);
  return db.$transaction(async (tx) => {
    // Serialize submissions for one account so rapid retries cannot create two pending requests.
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${user.id}::uuid FOR UPDATE`;
    if (await tx.organizer.findUnique({ where: { userId: user.id } }))
      throw new HttpError(409, "Already an organizer");
    if (await tx.organizerApplication.count({ where: { userId: user.id, status: "pending" } }))
      throw new HttpError(409, "Organizer application is already pending");
    await tx.user.update({ where: { id: user.id }, data: { phone } });
    const application = await tx.organizerApplication.create({
      data: { userId: user.id, name, description },
    });
    const admins = await tx.user.findMany({
      where: { role: "admin" },
      select: { authId: true },
    });
    for (const admin of admins) {
      await createNotification(
        admin.authId,
        {
          type: "noted",
          title: "Organizer application awaiting review",
          titleLo: "ມີຄຳຂໍ Organizer ລໍຖ້າກວດສອບ",
          message: `${name} applied to become an Organizer.`,
          messageLo: `${name} ໄດ້ສົ່ງຄຳຂໍເປັນ Organizer.`,
          data: { applicationId: application.id, status: "pending" },
        },
        tx,
      );
    }
    return application;
  });
}

/** Self-service organizer setup lets a signed-in user save drafts immediately. */
export async function activateOrganizer(uid: string) {
  const user = await getOrCreateUser(uid);
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${user.id}::uuid FOR UPDATE`;
    const current = await tx.user.findUnique({
      where: { id: user.id },
      include: { organizer: true },
    });
    if (!current) throw new HttpError(403, "A registered account is required");
    if (current.role === "admin") return { role: current.role, organizer: current.organizer };
    const name =
      [current.firstName, current.lastName].filter(Boolean).join(" ").trim() || "Organizer";
    const organizer = await tx.organizer.upsert({
      where: { userId: current.id },
      create: { userId: current.id, name },
      update: {},
    });
    if (current.role !== "organizer") {
      await tx.user.update({ where: { id: current.id }, data: { role: "organizer" } });
      await tx.auditLog.create({
        data: {
          actorId: current.id,
          action: "organizer.self_activated",
          entityType: "User",
          entityId: current.id,
        },
      });
    }
    return { role: "organizer", organizer };
  });
}

export async function reviewOrganizer(uid: string, id: string, approve: boolean, reason?: string) {
  return db.$transaction(async (tx) => {
    const admin = await tx.user.findUnique({ where: { authId: uid } });
    if (admin?.role !== "admin") throw new HttpError(403, "Admins only");
    await tx.$queryRaw`SELECT id FROM "OrganizerApplication" WHERE id = ${id}::uuid FOR UPDATE`;
    const application = await tx.organizerApplication.findUnique({ where: { id } });
    if (!application) throw new HttpError(404, "Application not found");
    if (application.status !== "pending") throw new HttpError(409, "Application already reviewed");
    if (!approve && !reason?.trim()) throw new HttpError(400, "Rejection reason is required");
    const row = await tx.organizerApplication.update({
      where: { id },
      data: {
        status: approve ? "approved" : "rejected",
        reviewedByUserId: admin.id,
        reviewedAt: new Date(),
        rejectionReason: approve ? null : reason,
      },
    });
    if (approve) {
      await tx.organizer.upsert({
        where: { userId: application.userId },
        create: {
          userId: application.userId,
          name: application.name,
          description: application.description,
        },
        update: { name: application.name, description: application.description },
      });
      await tx.user.updateMany({
        where: { id: application.userId, role: "user" },
        data: { role: "organizer" },
      });
    }
    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        action: approve ? "organizer.approved" : "organizer.rejected",
        entityType: "OrganizerApplication",
        entityId: id,
      },
    });
    const applicant = await tx.user.findUnique({
      where: { id: application.userId },
      select: { authId: true },
    });
    if (applicant) {
      await createNotification(
        applicant.authId,
        {
          type: approve ? "verified" : "system",
          title: approve ? "Organizer application approved" : "Organizer application rejected",
          titleLo: approve ? "ຄຳຂໍ Organizer ໄດ້ຮັບອະນຸມັດ" : "ຄຳຂໍ Organizer ຖືກປະຕິເສດ",
          message: approve
            ? "You can now create an Event."
            : `Your Organizer application was rejected: ${reason?.trim()}`,
          messageLo: approve
            ? "ທ່ານສາມາດສ້າງກິດຈະກຳໄດ້ແລ້ວ."
            : `ຄຳຂໍ Organizer ຖືກປະຕິເສດ: ${reason?.trim()}`,
          data: {
            applicationId: application.id,
            status: approve ? "approved" : "rejected",
            ...(!approve && reason?.trim() ? { rejectionReason: reason.trim() } : {}),
          },
        },
        tx,
      );
    }
    return row;
  });
}

export async function cancelEvent(uid: string, id: string) {
  return db.$transaction(async (tx) => {
    const admin = await tx.user.findUnique({ where: { authId: uid } });
    if (admin?.role !== "admin") throw new HttpError(403, "Admins only");
    await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${id}::uuid FOR UPDATE`;
    const event = await tx.event.findUnique({ where: { id } });
    if (!event) throw new HttpError(404, "Event not found");
    if (event.status === "cancelled") return event;
    const payments = await tx.payment.findMany({
      where: { order: { eventId: id }, state: "completed" },
    });
    for (const payment of payments) {
      // Lock the payment so concurrent refund approval cannot exceed the amount.
      await tx.$queryRaw`SELECT id FROM "Payment" WHERE id = ${payment.id}::uuid FOR UPDATE`;
      const reserved = await tx.refund.aggregate({
        where: { paymentId: payment.id, status: { notIn: ["rejected", "failed"] } },
        _sum: { amountKip: true },
      });
      const remaining = payment.amountKip - (reserved._sum.amountKip ?? 0);
      if (remaining > 0)
        await tx.refund.create({
          data: { paymentId: payment.id, amountKip: remaining, reason: "Event cancelled" },
        });
    }
    await tx.orderItem.updateMany({
      where: { order: { eventId: id }, status: { in: ["pending", "valid"] } },
      data: { status: "void" },
    });
    await tx.order.updateMany({
      where: { eventId: id, status: "pending" },
      data: { expiresAt: new Date() },
    });
    const result = await tx.event.update({ where: { id }, data: { status: "cancelled" } });
    await tx.auditLog.create({
      data: { actorId: admin.id, action: "event.cancelled", entityType: "Event", entityId: id },
    });
    return result;
  });
}

export async function approveRefund(uid: string, id: string) {
  return db.$transaction(async (tx) => {
    const admin = await tx.user.findUnique({ where: { authId: uid } });
    if (admin?.role !== "admin") throw new HttpError(403, "Admins only");
    const initial = await tx.refund.findUnique({ where: { id } });
    if (!initial) throw new HttpError(404, "Refund not found");
    await tx.$queryRaw`SELECT id FROM "Payment" WHERE id = ${initial.paymentId}::uuid FOR UPDATE`;
    const refund = await tx.refund.findUniqueOrThrow({
      where: { id },
      include: {
        payment: {
          include: {
            order: {
              include: { user: true, items: true },
            },
          },
        },
      },
    });
    if (refund.status !== "pending_approval") throw new HttpError(409, "Refund already reviewed");
    if (refund.payment.state !== "completed") throw new HttpError(409, "Payment is not settled");
    const reserved = await tx.refund.aggregate({
      where: {
        paymentId: refund.paymentId,
        id: { not: id },
        status: { in: ["approved", "processing", "succeeded"] },
      },
      _sum: { amountKip: true },
    });
    if ((reserved._sum.amountKip ?? 0) + refund.amountKip > refund.payment.amountKip)
      throw new HttpError(409, "Refund exceeds remaining paid amount");
    const result = await tx.refund.update({
      where: { id },
      data: { status: "approved", reviewedAt: new Date(), reviewedByUserId: admin.id },
    });
    if (refund.payment.order.status === "confirmed") {
      const activeItems = refund.payment.order.items.filter(
        (item) => item.status === "valid" || item.status === "pending",
      );
      const quantities = new Map<string, number>();
      for (const item of activeItems) {
        quantities.set(item.tierId, (quantities.get(item.tierId) ?? 0) + 1);
      }
      for (const [tierId, quantity] of quantities) {
        await tx.ticketTier.update({
          where: { id: tierId },
          data: { quantitySold: { decrement: quantity } },
        });
      }
      await tx.order.update({
        where: { id: refund.payment.orderId },
        data: { status: "refunded" },
      });
      await tx.orderItem.updateMany({
        where: { orderId: refund.payment.orderId },
        data: { status: "refunded" },
      });
    }
    await createNotification(
      refund.payment.order.user.authId,
      {
        type: "ticket",
        title: "Refund approved",
        titleLo: "ຄຳຮ້ອງຂໍຄືນເງິນໄດ້ຮັບອະນຸມັດ",
        message: `Your refund for ${refund.payment.order.eventTitle} (${refund.payment.order.orderNumber}) has been approved.`,
        messageLo: `ການຄືນເງິນສຳລັບ ${refund.payment.order.eventTitle} (${refund.payment.order.orderNumber}) ໄດ້ຮັບການອະນຸມັດແລ້ວ.`,
        data: { orderId: refund.payment.orderId, refundId: refund.id },
      },
      tx,
    );
    await tx.auditLog.create({
      data: { actorId: admin.id, action: "refund.approved", entityType: "Refund", entityId: id },
    });
    return result;
  });
}

export async function rejectRefund(uid: string, id: string) {
  return db.$transaction(async (tx) => {
    const admin = await tx.user.findUnique({ where: { authId: uid } });
    if (admin?.role !== "admin") throw new HttpError(403, "Admins only");
    const refund = await tx.refund.findUnique({ where: { id } });
    if (!refund) throw new HttpError(404, "Refund not found");
    if (refund.status !== "pending_approval") throw new HttpError(409, "Refund already reviewed");
    const result = await tx.refund.update({
      where: { id },
      data: { status: "rejected", reviewedAt: new Date(), reviewedByUserId: admin.id },
    });
    await tx.auditLog.create({
      data: { actorId: admin.id, action: "refund.rejected", entityType: "Refund", entityId: id },
    });
    return result;
  });
}

export async function createAdminRefund(
  uid: string,
  input: { reference: string; amountKip?: number; reason: string },
) {
  const code = input.reference.trim();
  return db.$transaction(async (tx) => {
    const admin = await tx.user.findUnique({ where: { authId: uid } });
    if (admin?.role !== "admin") throw new HttpError(403, "Admins only");
    const order = await tx.order.findFirst({
      where: {
        OR: [{ orderNumber: code }, { items: { some: { ticketCode: code } } }],
      },
      include: {
        payments: {
          where: { state: "completed" },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!order) throw new HttpError(404, "Order or ticket code not found");
    const payment = order.payments[0];
    if (!payment) throw new HttpError(409, "Order has no settled payment to refund");
    await tx.$queryRaw`SELECT id FROM "Payment" WHERE id = ${payment.id}::uuid FOR UPDATE`;
    const reserved = await tx.refund.aggregate({
      where: {
        paymentId: payment.id,
        status: { in: ["pending_approval", "approved", "processing", "succeeded"] },
      },
      _sum: { amountKip: true },
    });
    const remaining = payment.amountKip - (reserved._sum.amountKip ?? 0);
    if (remaining <= 0)
      throw new HttpError(409, "This payment already has a full refund requested or approved");
    const amountKip = input.amountKip ?? remaining;
    if (!Number.isSafeInteger(amountKip) || amountKip <= 0 || amountKip > remaining)
      throw new HttpError(409, "Refund amount exceeds remaining paid amount");
    const refund = await tx.refund.create({
      data: {
        paymentId: payment.id,
        amountKip,
        currency: payment.currency,
        reason: input.reason.trim(),
        status: "pending_approval",
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        action: "refund.created",
        entityType: "Refund",
        entityId: refund.id,
        metadata: { orderNumber: order.orderNumber, amountKip },
      },
    });
    return refund;
  });
}
