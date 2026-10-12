import { db } from "../config/database.ts";
import { HttpError } from "../middlewares/error.middleware.ts";
import type { Prisma } from "../lib/prisma.ts";

async function managerFor(tx: Prisma.TransactionClient, eventId: string, uid: string) {
  const [actor, event] = await Promise.all([
    tx.user.findUnique({ where: { authId: uid } }),
    tx.event.findUnique({ where: { id: eventId }, include: { organizer: true } }),
  ]);
  if (!event) throw new HttpError(404, "Event not found");
  if (
    !actor ||
    (actor.role !== "admin" && (actor.role !== "organizer" || event.organizer.userId !== actor.id))
  )
    throw new HttpError(403, "Only this event's organizer or an admin may manage staff");
  return actor;
}

export async function listEventStaff(eventId: string, uid: string) {
  await managerFor(db, eventId, uid);
  return db.eventStaff.findMany({
    where: { eventId, revokedAt: null },
    include: { user: { select: { id: true, authEmail: true, firstName: true, lastName: true } } },
    orderBy: { assignedAt: "desc" },
  });
}

export async function assignEventStaff(eventId: string, email: string, uid: string) {
  return db.$transaction(async (tx) => {
    const actor = await managerFor(tx, eventId, uid);
    const matches = await tx.user.findMany({
      where: { authEmail: { equals: email, mode: "insensitive" } },
      take: 2,
    });
    if (!matches.length)
      throw new HttpError(404, "User must sign in before being assigned as staff");
    if (matches.length > 1)
      throw new HttpError(409, "Email matches multiple accounts; contact an admin");
    const user = matches[0];
    const existing = await tx.eventStaff.findUnique({
      where: { eventId_userId: { eventId, userId: user.id } },
    });
    if (existing && !existing.revokedAt)
      throw new HttpError(409, "User is already assigned to this event");
    const assignment = existing
      ? await tx.eventStaff.update({
          where: { id: existing.id },
          data: { revokedAt: null, assignedAt: new Date(), assignedByUserId: actor.id },
        })
      : await tx.eventStaff.create({
          data: { eventId, userId: user.id, assignedByUserId: actor.id },
        });
    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: "event.staff.assigned",
        entityType: "EventStaff",
        entityId: assignment.id,
        metadata: { eventId, userId: user.id },
      },
    });
    return {
      ...assignment,
      user: {
        id: user.id,
        authEmail: user.authEmail,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  });
}

export async function revokeEventStaff(eventId: string, userId: string, uid: string) {
  return db.$transaction(async (tx) => {
    const actor = await managerFor(tx, eventId, uid);
    const assignment = await tx.eventStaff.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (!assignment || assignment.revokedAt)
      throw new HttpError(404, "Active staff assignment not found");
    const revoked = await tx.eventStaff.update({
      where: { id: assignment.id },
      data: { revokedAt: new Date() },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: "event.staff.revoked",
        entityType: "EventStaff",
        entityId: assignment.id,
        metadata: { eventId, userId },
      },
    });
    return revoked;
  });
}

export async function listScannerEvents(uid: string) {
  const actor = await db.user.findUnique({ where: { authId: uid } });
  if (!actor) return [];
  return db.event.findMany({
    where:
      actor.role === "admin"
        ? {}
        : {
            OR: [
              ...(actor.role === "organizer" ? [{ organizer: { userId: actor.id } }] : []),
              { staffAssignments: { some: { userId: actor.id, revokedAt: null } } },
            ],
          },
    select: { id: true, title: true, status: true, startDate: true, venueName: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
