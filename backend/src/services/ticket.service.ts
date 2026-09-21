import { randomBytes } from "node:crypto";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { db } from "../config/database.ts";
import { events, orderItems, orders, organizers, payments, ticketTiers } from "../models/schema.ts";
import { HttpError } from "../middlewares/error.middleware.ts";
import { createNotification } from "./notification.service.ts";
import { getOrCreateUser } from "./user.service.ts";

const code = (len = 6) =>
  randomBytes(len)
    .toString("base64")
    .replace(/[^A-Z0-9]/gi, "")
    .slice(0, len)
    .toUpperCase();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CreateOrderInput {
  uid: string;
  email?: string;
  /** events.id / slug / legacy id */
  eventId: string;
  /** ticket_tiers.id, or (fallback) the tier's name */
  tierId: string;
  tierName?: string;
  quantity: number;
  selectedDate?: string;
  selectedTime?: string;
  /** Gateway transaction id, when the buyer already paid through the gateway. */
  paymentTxnId?: string;
}

/** All orders (with their ticket items) for one buyer. */
export async function listOrders(uid: string) {
  return db.query.orders.findMany({
    where: eq(orders.buyerFirebaseUid, uid),
    orderBy: desc(orders.createdAt),
    with: { items: true },
  });
}

/**
 * Create an order plus one ticket item per unit of quantity.
 *
 * Nothing about price or availability is taken from the client: the event and
 * ticket type are looked up in the database, the total is computed from the
 * tier's price, and stock is decremented atomically (so two buyers can never
 * both get the last ticket). A free order is confirmed immediately; a paid one
 * stays `pending` until the gateway confirms the payment.
 */
export async function createOrder(input: CreateOrderInput) {
  const qty = input.quantity;
  const userRow = await getOrCreateUser(input.uid, input.email);

  return db.transaction(async (tx) => {
    const [event] = await tx
      .select()
      .from(events)
      .where(
        UUID_RE.test(input.eventId)
          ? eq(events.id, input.eventId)
          : or(eq(events.slug, input.eventId), eq(events.legacyId, input.eventId)),
      )
      .limit(1);
    if (!event) throw new HttpError(404, "Event not found");
    if (event.status !== "published")
      throw new HttpError(409, "Tickets are not on sale for this event");

    const [tier] = await tx
      .select()
      .from(ticketTiers)
      .where(
        and(
          eq(ticketTiers.eventId, event.id),
          UUID_RE.test(input.tierId)
            ? eq(ticketTiers.id, input.tierId)
            : eq(ticketTiers.name, input.tierName ?? input.tierId),
        ),
      )
      .limit(1);
    if (!tier || !tier.isActive) throw new HttpError(404, "Ticket type not found");
    if (tier.perOrderLimit && qty > tier.perOrderLimit) {
      throw new HttpError(422, `At most ${tier.perOrderLimit} tickets of this type per order`);
    }
    if (event.maxTicketsPerOrder && qty > event.maxTicketsPerOrder) {
      throw new HttpError(422, `At most ${event.maxTicketsPerOrder} tickets per order`);
    }

    // Atomic stock check + decrement (unlimited when quantity_total is null).
    const reserved = await tx
      .update(ticketTiers)
      .set({ quantitySold: sql`${ticketTiers.quantitySold} + ${qty}` })
      .where(
        and(
          eq(ticketTiers.id, tier.id),
          sql`(${ticketTiers.quantityTotal} is null or ${ticketTiers.quantitySold} + ${qty} <= ${ticketTiers.quantityTotal})`,
        ),
      )
      .returning({ id: ticketTiers.id });
    if (reserved.length === 0) throw new HttpError(409, "Not enough tickets left");

    const unit = tier.priceKip;
    const total = unit * qty;
    const orderNumber = `PSK-${code(8)}`;

    // A gateway transaction that is already verified as paid settles the order now.
    let paid = total === 0;
    if (!paid && input.paymentTxnId) {
      const [pay] = await tx
        .select({ state: payments.state })
        .from(payments)
        .where(eq(payments.transactionId, input.paymentTxnId))
        .limit(1);
      paid = pay?.state === "completed";
    }

    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber,
        userId: userRow.id,
        buyerFirebaseUid: input.uid,
        eventId: event.id,
        eventTitle: event.title,
        status: paid ? "confirmed" : "pending",
        subtotalKip: total,
        totalKip: total,
        selectedDate: input.selectedDate ?? null,
        selectedTime: input.selectedTime ?? null,
        buyerEmail: input.email ?? null,
        paymentTxnId: input.paymentTxnId ?? null,
        paymentStatus: paid ? "completed" : null,
        paidAt: paid ? new Date() : null,
      })
      .returning();

    const items = await tx
      .insert(orderItems)
      .values(
        Array.from({ length: qty }, (_, i) => ({
          orderId: order.id,
          tierId: tier.id,
          tierName: tier.name,
          unitPriceKip: unit,
          ticketCode: `${orderNumber}-${i + 1}-${code(4)}`,
        })),
      )
      .returning();

    if (paid && input.paymentTxnId) {
      await tx
        .update(payments)
        .set({ orderId: order.id })
        .where(eq(payments.transactionId, input.paymentTxnId));
    }

    await createNotification(
      input.uid,
      paid
        ? ticketConfirmed(order.orderNumber, event.title, qty, event.id, order.id)
        : awaitingPayment(order.orderNumber, event.title, event.id, order.id),
      tx,
    );

    // Tell the organizer someone bought from them.
    const [owner] = event.organizerId
      ? await tx
          .select({ uid: organizers.ownerFirebaseUid })
          .from(organizers)
          .where(eq(organizers.id, event.organizerId))
          .limit(1)
      : [];
    if (owner?.uid && owner.uid !== input.uid) {
      await createNotification(
        owner.uid,
        {
          type: "ticket",
          title: "New ticket order",
          titleLo: "ມີການສັ່ງຊື້ປີ້ໃໝ່",
          message: `${qty} ticket(s) for ${event.title} - order ${order.orderNumber}${paid ? "" : " (awaiting payment)"}.`,
          messageLo: `ປີ້ ${qty} ໃບ ສຳລັບ ${event.title} - ອໍເດີ ${order.orderNumber}${paid ? "" : " (ລໍຖ້າຊຳລະ)"}.`,
          data: { eventId: event.id, orderId: order.id },
        },
        tx,
      );
    }

    return { order, items };
  });
}

/**
 * Called once the gateway has verified a payment: confirm the pending order that
 * was placed against this transaction (if any) and tell the buyer.
 */
export async function confirmOrderForPayment(transactionId: string) {
  return db.transaction(async (tx) => {
    const [order] = await tx
      .update(orders)
      .set({
        status: "confirmed",
        paymentStatus: "completed",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(orders.paymentTxnId, transactionId), eq(orders.status, "pending")))
      .returning();
    if (!order) return null;

    await tx
      .update(payments)
      .set({ orderId: order.id })
      .where(eq(payments.transactionId, transactionId));

    const [{ n }] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));
    await createNotification(
      order.buyerFirebaseUid,
      ticketConfirmed(order.orderNumber, order.eventTitle, n, order.eventId, order.id),
      tx,
    );
    return order;
  });
}

/**
 * Cancel orders that were reserved but never paid, and give their stock back.
 * Without this an abandoned checkout would hold tickets forever.
 */
export async function releaseExpiredOrders(maxAgeMinutes = 30) {
  return db.transaction(async (tx) => {
    const expired = await tx
      .update(orders)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(
        and(
          eq(orders.status, "pending"),
          sql`${orders.totalKip} > 0`,
          sql`${orders.createdAt} < now() - make_interval(mins => ${maxAgeMinutes})`,
        ),
      )
      .returning({ id: orders.id });

    for (const { id } of expired) {
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, id));
      const perTier = new Map<string, number>();
      for (const it of items) perTier.set(it.tierId, (perTier.get(it.tierId) ?? 0) + 1);
      for (const [tierId, n] of perTier) {
        await tx
          .update(ticketTiers)
          .set({ quantitySold: sql`greatest(${ticketTiers.quantitySold} - ${n}, 0)` })
          .where(eq(ticketTiers.id, tierId));
      }
      await tx.update(orderItems).set({ status: "void" }).where(eq(orderItems.orderId, id));
    }
    return expired.length;
  });
}

const ticketConfirmed = (
  orderNumber: string,
  eventTitle: string,
  qty: number,
  eventId: string,
  orderId: string,
) => ({
  type: "ticket" as const,
  title: "Ticket confirmed",
  titleLo: "ຢືນຢັນປີ້ສຳເລັດແລ້ວ",
  message: `Order ${orderNumber}: ${qty} ticket(s) for ${eventTitle} are ready.`,
  messageLo: `ອໍເດີ ${orderNumber}: ປີ້ ${qty} ໃບ ສຳລັບ ${eventTitle} ພ້ອມໃຊ້ງານແລ້ວ.`,
  data: { eventId, orderId },
});

const awaitingPayment = (
  orderNumber: string,
  eventTitle: string,
  eventId: string,
  orderId: string,
) => ({
  type: "ticket" as const,
  title: "Awaiting payment",
  titleLo: "ລໍຖ້າການຊຳລະເງິນ",
  message: `Order ${orderNumber} for ${eventTitle} is reserved. Complete the payment to receive your tickets.`,
  messageLo: `ອໍເດີ ${orderNumber} ສຳລັບ ${eventTitle} ຖືກສະຫງວນໄວ້ແລ້ວ. ກະລຸນາຊຳລະເງິນເພື່ອຮັບປີ້.`,
  data: { eventId, orderId },
});
