import { db } from "../config/database.ts";
import type { Prisma } from "../lib/prisma.ts";
import { assertMediaReferences } from "./media.service.ts";
import { HttpError } from "../middlewares/error.middleware.ts";
import type { CreateEventBody, UpdateEventBody } from "../validators/event.validator.ts";
const include = { tiers: true, dates: true, coupons: true, organizer: true } as const;
const publicStates = ["published", "sold_out", "completed"] as const;
const refWhere = (ref: string) => /^[0-9a-f-]{36}$/i.test(ref) ? { id: ref } : { slug: ref };
function columns(body: Partial<CreateEventBody>) {
  const { organizer: _o, tiers: _t, dates: _d, coupons: _c, legacyId: _l, hasSeating: _s, startDate, endDate, ...rest } = body;
  return { ...rest, ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}), ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}) };
}
async function children(tx: Prisma.TransactionClient, eventId: string, body: Partial<CreateEventBody>) {
  if (body.tiers?.length) await tx.ticketTier.createMany({ data: body.tiers.map(t => ({ ...t, eventId })) });
  if (body.dates?.length) await tx.eventDate.createMany({ data: body.dates.map(d => ({ ...d, date: new Date(d.date), eventId })) });
  if (body.coupons?.length) await tx.coupon.createMany({ data: body.coupons.map(c => ({ ...c, eventId })) });
}
export async function createEvent(body: CreateEventBody, uid: string) {
  if (body.rejectionReason) throw new HttpError(400, "Review reasons cannot be set when creating events");
  assertMediaReferences(body, uid);
  return db.$transaction(async tx => {
    const user = await tx.user.findUnique({ where: { authId: uid }, include: { organizer: true } });
    if (!user?.organizer) throw new HttpError(403, "An approved organizer profile is required");
    if (!["draft", "pending_review"].includes(body.status ?? "draft")) throw new HttpError(403, "Submit the event for admin review before publication");
    const event = await tx.event.create({ data: { ...columns(body), title: body.title, organizerId: user.organizer.id } });
    await children(tx, event.id, body);
    return tx.event.findUnique({ where: { id: event.id }, include });
  });
}
export async function updateEvent(ref: string, patch: UpdateEventBody, uid: string) {
  assertMediaReferences(patch, uid);
  return db.$transaction(async tx => {
    const event = await tx.event.findFirst({ where: refWhere(ref), include: { organizer: true } });
    if (!event) return null;
    const [locked] = await tx.$queryRaw<Array<{ status: string }>>`SELECT status FROM "Event" WHERE id = ${event.id}::uuid FOR UPDATE`;
    if (!locked) return null;
    event.status = locked.status as typeof event.status;
    const actor = await tx.user.findUnique({ where: { authId: uid } });
    if (!actor || (actor.role !== "admin" && event.organizer.userId !== actor.id)) throw new HttpError(403, "You do not have permission to modify this event");
    if (["cancelled", "completed"].includes(event.status)) throw new HttpError(409, "Closed events cannot be modified or reopened");
    if (patch.status && !["draft", "pending_review"].includes(patch.status) && actor.role !== "admin") throw new HttpError(403, "Admin review is required");
    if (patch.status === "published" && event.status !== "pending_review") throw new HttpError(409, "Event must be submitted for review");
    if (patch.status === "rejected" && (event.status !== "pending_review" || !patch.rejectionReason?.trim())) throw new HttpError(400, "Reject a submitted event with a reason");
    if (patch.rejectionReason && actor.role !== "admin") throw new HttpError(403, "Only admins may set review reasons");
    if (patch.status === "cancelled") throw new HttpError(409, "Use the audited cancellation workflow");
    if (patch.tiers !== undefined && await tx.order.count({ where: { eventId: event.id } })) throw new HttpError(409, "Ticket tiers cannot be replaced after orders exist");
    const data = columns(patch);
    if (patch.status === "published" || patch.status === "pending_review") Object.assign(data, { rejectionReason: null });
    if (actor.role !== "admin" && event.status === "published") data.status = "pending_review";
    await tx.event.update({ where: { id: event.id }, data });
    if (patch.tiers !== undefined) await tx.ticketTier.deleteMany({ where: { eventId: event.id } });
    if (patch.dates !== undefined) await tx.eventDate.deleteMany({ where: { eventId: event.id } });
    if (patch.coupons !== undefined) await tx.coupon.deleteMany({ where: { eventId: event.id } });
    await children(tx, event.id, patch);
    if (data.status && data.status !== event.status) {
      if (actor.role === "admin" && ["published", "rejected"].includes(patch.status)) await tx.event.update({ where: { id: event.id }, data: { reviewedByUserId: actor.id, reviewedAt: new Date() } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "event.status", entityType: "Event", entityId: event.id, metadata: { before: event.status, after: data.status } } });
    }
    return tx.event.findUnique({ where: { id: event.id }, include });
  });
}
export async function listEvents(query: { status?: string; mine?: boolean; viewerUid?: string; limit: number }) {
  if (query.mine && !query.viewerUid) throw new HttpError(401, "Sign in to list your events");
  const where: Prisma.EventWhereInput = query.mine ? { organizer: { user: { authId: query.viewerUid } } } : { status: { in: [...publicStates] } };
  return db.event.findMany({ where: { AND: [where, ...(query.status ? [{ status: query.status as any }] : [])] }, include, orderBy: { createdAt: "desc" }, take: query.limit });
}
export async function getEvent(ref: string, uid?: string) {
  const event = await db.event.findFirst({ where: refWhere(ref), include });
  if (!event) return null;
  if (!(publicStates as readonly string[]).includes(event.status)) {
    const actor = uid ? await db.user.findUnique({ where: { authId: uid } }) : null;
    if (!actor || (actor.role !== "admin" && event.organizer.userId !== actor.id)) return null;
  }
  return event;
}
