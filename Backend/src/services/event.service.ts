import { and, desc, eq, or } from "drizzle-orm";
import { db } from "../config/database.ts";
import {
  coupons,
  eventDates,
  events,
  organizers,
  ticketTiers,
  ticketZones,
} from "../models/schema.ts";
import { logger } from "../utils/logger.ts";
import type { CreateEventBody, UpdateEventBody } from "../validators/event.validator.ts";

const inMemoryEvents: any[] = [];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** `db` or a transaction handle — the query builders these share. */
type Executor = Pick<typeof db, "insert" | "select" | "update" | "delete" | "query">;

/** Columns that live directly on the `events` row (i.e. not the nested arrays). */
function eventColumns<T extends Partial<CreateEventBody>>(body: T) {
  const { organizer: _o, tiers: _t, zones: _z, dates: _d, coupons: _c, ...cols } = body;
  return cols;
}

async function insertChildren(tx: Executor, eventId: string, body: Partial<CreateEventBody>) {
  if (body.tiers?.length) {
    await tx.insert(ticketTiers).values(body.tiers.map((tItem) => ({ ...tItem, eventId })));
  }
  if (body.zones?.length) {
    await tx.insert(ticketZones).values(body.zones.map((z) => ({ ...z, eventId })));
  }
  if (body.dates?.length) {
    await tx.insert(eventDates).values(body.dates.map((d) => ({ ...d, eventId })));
  }
  if (body.coupons?.length) {
    await tx.insert(coupons).values(body.coupons.map((c) => ({ ...c, eventId })));
  }
}

/** Create an event and all of its tiers / zones / dates / coupons atomically. */
export async function createEvent(body: CreateEventBody, ownerUid: string) {
  try {
    return await db.transaction(async (tx) => {
      let organizerId: string | undefined;
      if (body.organizer) {
        const [org] = await tx
          .insert(organizers)
          .values({ ...body.organizer, ownerFirebaseUid: ownerUid })
          .returning();
        organizerId = org.id;
      }

      const [event] = await tx
        .insert(events)
        .values({ ...eventColumns(body), organizerId })
        .returning();

      await insertChildren(tx, event.id, body);
      return getEventById(event.id, tx);
    });
  } catch (error: any) {
    logger.warn("[event.service] createEvent DB fallback:", error?.message);
    const event = {
      id: `mem-${inMemoryEvents.length + 1}`,
      ...eventColumns(body),
      ownerFirebaseUid: ownerUid,
      tiers: body.tiers,
      zones: body.zones,
      dates: body.dates,
      coupons: body.coupons,
      createdAt: new Date().toISOString(),
    };
    inMemoryEvents.unshift(event);
    return event;
  }
}

/** Update event columns; nested arrays, when provided, replace the existing set. */
export async function updateEvent(idOrRef: string, patch: UpdateEventBody) {
  try {
    return await db.transaction(async (tx) => {
      const existing = await resolveEvent(idOrRef, tx);
      if (!existing) return null;

      await tx
        .update(events)
        .set({ ...eventColumns(patch), updatedAt: new Date() })
        .where(eq(events.id, existing.id));

      for (const [key, table] of [
        ["tiers", ticketTiers],
        ["zones", ticketZones],
        ["dates", eventDates],
        ["coupons", coupons],
      ] as const) {
        if (patch[key] !== undefined) {
          await tx.delete(table).where(eq(table.eventId, existing.id));
        }
      }
      await insertChildren(tx, existing.id, patch);

      return getEventById(existing.id, tx);
    });
  } catch (error: any) {
    logger.warn("[event.service] updateEvent DB fallback:", error?.message);
    const idx = inMemoryEvents.findIndex((e) => e.id === idOrRef || e.legacyId === idOrRef);
    if (idx < 0) return null;
    inMemoryEvents[idx] = { ...inMemoryEvents[idx], ...patch, updatedAt: new Date().toISOString() };
    return inMemoryEvents[idx];
  }
}

export async function listEvents(query: { status?: string; organizerUid?: string; limit: number }) {
  try {
    const filters = [];
    if (query.status) filters.push(eq(events.status, query.status as any));
    if (query.organizerUid) filters.push(eq(organizers.ownerFirebaseUid, query.organizerUid));

    return await db.query.events.findMany({
      where: filters.length ? and(...filters) : undefined,
      orderBy: desc(events.createdAt),
      limit: query.limit,
      with: { tiers: true, zones: true, dates: true, coupons: true, organizer: true },
    });
  } catch (error: any) {
    logger.warn("[event.service] listEvents DB fallback:", error?.message);
    return inMemoryEvents.slice(0, query.limit);
  }
}

export async function getEvent(idOrRef: string) {
  try {
    const row = await resolveEvent(idOrRef, db);
    return row ? getEventById(row.id, db) : null;
  } catch (error: any) {
    logger.warn("[event.service] getEvent DB fallback:", error?.message);
    return inMemoryEvents.find((e) => e.id === idOrRef || e.legacyId === idOrRef) ?? null;
  }
}

/* ---- internal helpers ---- */

async function resolveEvent(ref: string, exec: Executor) {
  const where = UUID_RE.test(ref)
    ? eq(events.id, ref)
    : or(eq(events.slug, ref), eq(events.legacyId, ref));
  const [row] = await exec.select({ id: events.id }).from(events).where(where).limit(1);
  return row ?? null;
}

function getEventById(id: string, exec: Executor) {
  return exec.query.events.findFirst({
    where: eq(events.id, id),
    with: { tiers: true, zones: true, dates: true, coupons: true, organizer: true },
  });
}
