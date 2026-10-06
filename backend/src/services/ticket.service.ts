import { randomUUID } from "node:crypto";
import { db } from "../config/database.ts";
import { HttpError } from "../middlewares/error.middleware.ts";
import { createNotification } from "./notification.service.ts";
import { getOrCreateUser } from "./user.service.ts";
export interface CreateOrderInput {
  uid: string; email?: string; eventId: string; tierId: string; tierName?: string;
  quantity: number; selectedDate?: string; selectedTime?: string; paymentTxnId?: string;
  attendees?: Array<{ firstName?: string; lastName?: string; email?: string; phone?: string; customAnswers?: Record<string,string|string[]> }>;
}
export async function listOrders(uid: string) {
  return db.order.findMany({ where: { user: { authId: uid } }, orderBy: { createdAt: "desc" }, include: { items: true } });
}
export async function createOrder(input: CreateOrderInput) {
  if (input.paymentTxnId) throw new HttpError(400, "Payment references must be created by the server");
  const user = await getOrCreateUser(input.uid, input.email);
  return db.$transaction(async tx => {
    const event = await tx.event.findFirst({ where: /^[0-9a-f-]{36}$/i.test(input.eventId) ? { id: input.eventId } : { slug: input.eventId }, include: { organizer: { include: { user: true } } } });
    if (!event) throw new HttpError(404, "Event not found");
    // Share the event lock with moderation so a cancellation cannot miss a new order.
    const [locked] = await tx.$queryRaw<Array<{ status: string }>>`SELECT status FROM "Event" WHERE id = ${event.id}::uuid FOR UPDATE`;
    if (locked?.status !== "published") throw new HttpError(409, "Tickets are not on sale for this event");
    // Tier identifiers are canonical UUIDs; names are not purchase identifiers.
    if (!/^[0-9a-f-]{36}$/i.test(input.tierId)) throw new HttpError(404, "Ticket type not found");
    const tier = await tx.ticketTier.findFirst({ where: { id: input.tierId, eventId: event.id, isActive: true } });
    if (!tier) throw new HttpError(404, "Ticket type not found");
    const qty = input.quantity;
    if (!Number.isSafeInteger(qty) || qty < 1) throw new HttpError(400, "Invalid quantity");
    if ((tier.perOrderLimit && qty > tier.perOrderLimit) || (event.maxTicketsPerOrder && qty > event.maxTicketsPerOrder)) throw new HttpError(422, "Per-order ticket limit exceeded");
    const total = tier.priceKip * qty;
    if (!Number.isSafeInteger(total) || total > 2147483647) throw new HttpError(422, "Order amount exceeds supported limit");
    const changed = await tx.$executeRaw`UPDATE "TicketTier" SET "quantitySold" = "quantitySold" + ${qty} WHERE id = ${tier.id}::uuid AND ("quantityTotal" IS NULL OR "quantitySold" + ${qty} <= "quantityTotal")`;
    if (!changed) throw new HttpError(409, "Not enough tickets left");
    const paid = total === 0;
    // Use one database clock for both reservation and expiry (application hosts may drift).
    const [clock] = await tx.$queryRaw<Array<{ expiresAt: Date }>>`SELECT now() + interval '15 minutes' AS "expiresAt"`;
    const orderNumber = "PSK-" + randomUUID().toUpperCase();
    const order = await tx.order.create({ data: {
      orderNumber, userId: user.id, eventId: event.id, eventTitle: event.title,
      status: paid ? "confirmed" : "pending", subtotalKip: total, totalKip: total,
      expiresAt: clock.expiresAt, paidAt: paid ? new Date() : null,
      buyerEmail: input.email, selectedDate: input.selectedDate, selectedTime: input.selectedTime,
      items: { create: Array.from({ length: qty }, (_, i) => {
        const a = input.attendees?.[i];
        return { tierId: tier.id, tierName: tier.name, unitPriceKip: tier.priceKip,
          ticketCode: orderNumber + "-" + (i+1) + "-" + randomUUID(), status: paid ? "valid" as const : "pending" as const,
          attendeeName: [a?.firstName,a?.lastName].filter(Boolean).join(" ") || null,
          attendeeEmail: a?.email, attendeePhone: a?.phone, customAnswers: a?.customAnswers };
      }) },
    }, include: { items: true } });
    await createNotification(input.uid, { type: "ticket", title: paid ? "Ticket confirmed" : "Awaiting payment", message: event.title, data: { eventId: event.id, orderId: order.id } }, tx);
    if (event.organizer.user.authId !== input.uid) await createNotification(event.organizer.user.authId, { type: "ticket", title: "New ticket order", message: event.title, data: { orderId: order.id } }, tx);
    const { items, ...row } = order;
    return { order: row, items };
  });
}
export async function releaseExpiredOrders() {
  return db.$transaction(async tx => {
    const expired = await tx.$queryRaw<Array<{id:string}>>`UPDATE "Order" SET status = 'cancelled', "updatedAt" = now() WHERE status = 'pending' AND "expiresAt" <= now() RETURNING id`;
    for (const {id} of expired) {
      const items = await tx.orderItem.findMany({ where: { orderId: id } });
      const quantities = new Map<string,number>();
      for (const item of items) quantities.set(item.tierId, (quantities.get(item.tierId) ?? 0) + 1);
      for (const [tierId, quantity] of quantities) await tx.ticketTier.update({ where: { id: tierId }, data: { quantitySold: { decrement: quantity } } });
      await tx.orderItem.updateMany({ where: { orderId: id }, data: { status: "void" } });
      await tx.auditLog.create({ data: { action: "order.expired", entityType: "Order", entityId: id } });
    }
    return expired.length;
  });
}
