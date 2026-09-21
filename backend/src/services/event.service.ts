import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "../config/database.ts";
import {
  coupons,
  eventDates,
  events,
  organizers,
  ticketTiers,
  ticketZones,
} from "../models/schema.ts";
import { HttpError } from "../middlewares/error.middleware.ts";
import { getUserRole } from "./user.service.ts";
import type { CreateEventBody, UpdateEventBody } from "../validators/event.validator.ts";

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
  return db.transaction(async (tx) => {
    // Every event is owned by an organizer profile belonging to its creator, so
    // ownership can be enforced on update. Reuse the creator's existing profile.
    let [org] = await tx
      .select()
      .from(organizers)
      .where(eq(organizers.ownerFirebaseUid, ownerUid))
      .limit(1);
    if (org && body.organizer) {
      [org] = await tx
        .update(organizers)
        .set({ ...body.organizer, updatedAt: new Date() })
        .where(eq(organizers.id, org.id))
        .returning();
    } else if (!org) {
      [org] = await tx
        .insert(organizers)
        .values({
          name: body.organizer?.name ?? "Organizer",
          ...body.organizer,
          ownerFirebaseUid: ownerUid,
        })
        .returning();
    }

    const [event] = await tx
      .insert(events)
      .values({ ...eventColumns(body), organizerId: org.id })
      .returning();

    await insertChildren(tx, event.id, body);
    return getEventById(event.id, tx);
  });
}

/** Update event columns; nested arrays, when provided, replace the existing set. */
export async function updateEvent(idOrRef: string, patch: UpdateEventBody, actorUid: string) {
  return db.transaction(async (tx) => {
    const existing = await resolveEvent(idOrRef, tx);
    if (!existing) return null;
    await assertCanEdit(tx, existing.id, actorUid);

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
}

/**
 * Public catalog listing. Callers only see published (and sold-out/completed)
 * events unless they ask for their own events (`mine`), which includes drafts.
 */
export async function listEvents(query: {
  status?: string;
  mine?: boolean;
  viewerUid?: string;
  limit: number;
}) {
  const filters = [];
  if (query.mine) {
    if (!query.viewerUid) throw new HttpError(401, "Sign in to list your events");
    filters.push(eq(organizers.ownerFirebaseUid, query.viewerUid));
  } else {
    filters.push(inArray(events.status, PUBLIC_STATUSES));
  }
  if (query.status) filters.push(eq(events.status, query.status as any));

  const rows = await db
    .select({ id: events.id })
    .from(events)
    .leftJoin(organizers, eq(events.organizerId, organizers.id))
    .where(and(...filters))
    .orderBy(desc(events.createdAt))
    .limit(query.limit);

  if (rows.length === 0) return [];
  return db.query.events.findMany({
    where: inArray(
      events.id,
      rows.map((r) => r.id),
    ),
    orderBy: desc(events.createdAt),
    with: { tiers: true, zones: true, dates: true, coupons: true, organizer: true },
  });
}

/** One event by uuid / slug / legacy id. Drafts are visible only to their owner or an admin. */
export async function getEvent(idOrRef: string, viewerUid?: string) {
  const row = await resolveEvent(idOrRef, db);
  if (!row) return null;
  const event = await getEventById(row.id, db);
  if (!event) return null;
  if (!PUBLIC_STATUSES.includes(event.status)) {
    const allowed = viewerUid ? await canEdit(db, event.id, viewerUid) : false;
    if (!allowed) return null;
  }
  return event;
}

/* ---- internal helpers ---- */

const PUBLIC_STATUSES: (typeof events.$inferSelect)["status"][] = [
  "published",
  "sold_out",
  "completed",
];

/** Owner of the event's organizer profile, or an admin. */
async function canEdit(exec: Executor, eventId: string, uid: string) {
  const [row] = await exec
    .select({ owner: organizers.ownerFirebaseUid })
    .from(events)
    .leftJoin(organizers, eq(events.organizerId, organizers.id))
    .where(eq(events.id, eventId))
    .limit(1);
  if (row?.owner && row.owner === uid) return true;
  return (await getUserRole(uid, exec)) === "admin";
}

async function assertCanEdit(exec: Executor, eventId: string, uid: string) {
  if (!(await canEdit(exec, eventId, uid))) {
    throw new HttpError(403, "You do not have permission to modify this event");
  }
}

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
