import { desc, eq } from "drizzle-orm";
import { db } from "../config/database.ts";
import { checkIns, orderItems, orders } from "../models/schema.ts";
import { HttpError } from "../middlewares/error.middleware.ts";
import type { CreateCheckinBody } from "../validators/checkin.validator.ts";

export interface ScanResult {
  status: "checked_in" | "already_checked_in";
  checkIn: Record<string, unknown>;
}

/**
 * Record a gate scan of `ticketCode`. The check-in is linked to the order item
 * it belongs to and that item is flagged `checked_in`. Re-scanning the same
 * code is idempotent and reports `already_checked_in`.
 */
export async function scanTicket(body: CreateCheckinBody, staff: string): Promise<ScanResult> {
  const existing = await db.query.checkIns.findFirst({
    where: eq(checkIns.ticketCode, body.ticketCode),
  });
  if (existing) return { status: "already_checked_in", checkIn: existing };

  const item = await db.query.orderItems.findFirst({
    where: eq(orderItems.ticketCode, body.ticketCode),
  });
  if (!item) throw new HttpError(404, "Ticket not found");

  const [order] = await db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.id, item.orderId))
    .limit(1);
  if (order?.status !== "confirmed" && order?.status !== "paid") {
    throw new HttpError(409, "This ticket has not been paid for");
  }
  if (item.status === "void" || item.status === "refunded") {
    throw new HttpError(409, `This ticket is ${item.status}`);
  }

  return db.transaction(async (tx) => {
    const [checkIn] = await tx
      .insert(checkIns)
      .values({
        ticketCode: body.ticketCode,
        eventId: body.eventId,
        orderItemId: item.id,
        attendeeName: body.attendeeName ?? item.attendeeName ?? null,
        ticketType: body.ticketType ?? item.tierName ?? null,
        seatLabel: body.seatLabel ?? item.seatLabel ?? null,
        checkedInBy: staff,
        gate: body.gate ?? null,
        note: body.note ?? null,
      })
      .returning();

    await tx.update(orderItems).set({ status: "checked_in" }).where(eq(orderItems.id, item.id));
    return { status: "checked_in" as const, checkIn };
  });
}

export async function listCheckins(eventId: string) {
  return db
    .select()
    .from(checkIns)
    .where(eq(checkIns.eventId, eventId))
    .orderBy(desc(checkIns.checkedInAt));
}

/**
 * Look up a scanned code against the real order item WITHOUT checking it in
 * — the gate app shows this to staff so they can verify the attendee before
 * tapping "confirm" (which then calls scanTicket).
 */
export async function lookupTicket(ticketCode: string) {
  const item = await db.query.orderItems.findFirst({
    where: eq(orderItems.ticketCode, ticketCode),
  });
  if (!item) return null;

  const [order] = await db
    .select({
      status: orders.status,
      eventId: orders.eventId,
      eventTitle: orders.eventTitle,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.id, item.orderId))
    .limit(1);

  const existingCheckIn = await db.query.checkIns.findFirst({
    where: eq(checkIns.ticketCode, ticketCode),
  });

  return {
    ticketCode: item.ticketCode,
    itemStatus: item.status,
    orderStatus: order?.status ?? null,
    eventId: order?.eventId ?? null,
    eventTitle: order?.eventTitle ?? null,
    orderCreatedAt: order?.createdAt ?? null,
    tierName: item.tierName,
    seatLabel: item.seatLabel,
    zoneName: item.zoneName,
    unitPriceKip: item.unitPriceKip,
    attendeeName: item.attendeeName,
    attendeeEmail: item.attendeeEmail,
    attendeePhone: item.attendeePhone,
    customAnswers: item.customAnswers,
    alreadyCheckedIn: !!existingCheckIn,
    checkedInAt: existingCheckIn?.checkedInAt ?? null,
  };
}
