import { desc, eq } from "drizzle-orm";
import { db } from "../config/database.ts";
import { checkIns, orderItems } from "../models/schema.ts";
import { logger } from "../utils/logger.ts";
import type { CreateCheckinBody } from "../validators/checkin.validator.ts";

const inMemoryCheckIns: any[] = [];

export interface ScanResult {
  status: "checked_in" | "already_checked_in";
  checkIn: Record<string, unknown>;
}

/**
 * Record a gate scan of `ticketCode`. If the ticket exists in Postgres the
 * check-in is linked to its order item and the item is flagged `checked_in`;
 * otherwise it is recorded loosely (transition period). Re-scanning the same
 * code is idempotent and reports `already_checked_in`.
 */
export async function scanTicket(body: CreateCheckinBody, staff: string): Promise<ScanResult> {
  try {
    const existing = await db.query.checkIns.findFirst({
      where: eq(checkIns.ticketCode, body.ticketCode),
    });
    if (existing) return { status: "already_checked_in", checkIn: existing };

    const item = await db.query.orderItems.findFirst({
      where: eq(orderItems.ticketCode, body.ticketCode),
    });

    return await db.transaction(async (tx) => {
      const [checkIn] = await tx
        .insert(checkIns)
        .values({
          ticketCode: body.ticketCode,
          eventId: body.eventId,
          orderItemId: item?.id ?? null,
          attendeeName: body.attendeeName ?? item?.attendeeName ?? null,
          ticketType: body.ticketType ?? item?.tierName ?? null,
          seatLabel: body.seatLabel ?? item?.seatLabel ?? null,
          checkedInBy: staff,
          gate: body.gate ?? null,
          note: body.note ?? null,
        })
        .returning();

      if (item) {
        await tx.update(orderItems).set({ status: "checked_in" }).where(eq(orderItems.id, item.id));
      }
      return { status: "checked_in" as const, checkIn };
    });
  } catch (error: any) {
    logger.warn("[checkin.service] scan DB fallback:", error?.message);
    const dup = inMemoryCheckIns.find((c) => c.ticketCode === body.ticketCode);
    if (dup) return { status: "already_checked_in", checkIn: dup };
    const checkIn = {
      id: `mem-${inMemoryCheckIns.length + 1}`,
      ...body,
      checkedInBy: staff,
      checkedInAt: new Date().toISOString(),
    };
    inMemoryCheckIns.unshift(checkIn);
    return { status: "checked_in", checkIn };
  }
}

export async function listCheckins(eventId: string) {
  try {
    return await db
      .select()
      .from(checkIns)
      .where(eq(checkIns.eventId, eventId))
      .orderBy(desc(checkIns.checkedInAt));
  } catch (error: any) {
    logger.warn("[checkin.service] list DB fallback:", error?.message);
    return inMemoryCheckIns.filter((c) => c.eventId === eventId);
  }
}
