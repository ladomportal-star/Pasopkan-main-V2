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

export async function assignEventStaff(
  eventId: string,
  identifier: string,
  gateLabel: string | undefined,
  uid: string,
) {
  return db.$transaction(async (tx) => {
    const actor = await managerFor(tx, eventId, uid);
    const normalized = identifier.trim().replace(/\s+/g, " ");
    const isEmail = normalized.includes("@");
    const nameParts = normalized.split(" ");
    const nameMatches = isEmail
      ? []
      : [
          ...(nameParts.length === 1
            ? [
                { firstName: { equals: normalized, mode: "insensitive" as const } },
                { lastName: { equals: normalized, mode: "insensitive" as const } },
              ]
            : []),
          {
            AND: [
              { firstName: { equals: nameParts[0], mode: "insensitive" as const } },
              {
                lastName: {
                  equals: nameParts.slice(1).join(" "),
                  mode: "insensitive" as const,
                },
              },
            ],
          },
        ];
    const matches = await tx.user.findMany({
      where: {
        deletedAt: null,
        isSuspended: false,
        ...(isEmail
          ? { authEmail: { equals: normalized, mode: "insensitive" } }
          : { OR: nameMatches }),
      },
      take: 2,
    });
    if (!matches.length) {
      if (isEmail) throw new HttpError(404, "No active Pasopkan account matches that email");
      const duplicate = await tx.eventStaff.findFirst({
        where: {
          eventId,
          userId: null,
          revokedAt: null,
          staffName: { equals: normalized, mode: "insensitive" },
        },
      });
      if (duplicate)
        throw new HttpError(409, "A staff entry with this name already exists for this event");
      const pending = await tx.eventStaff.create({
        data: {
          eventId,
          userId: null,
          staffName: normalized,
          gateLabel: gateLabel?.trim() || null,
          assignedByUserId: actor.id,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "event.staff.pending_added",
          entityType: "EventStaff",
          entityId: pending.id,
          metadata: { eventId, staffName: normalized },
        },
      });
      return { ...pending, user: null };
    }
    if (matches.length > 1)
      throw new HttpError(
        409,
        isEmail
          ? "Email matches multiple accounts; contact an admin"
          : "More than one account has that name. Use the email or phone-linked account details to identify the staff member.",
      );
    const user = matches[0];
    const existing = await tx.eventStaff.findUnique({
      where: { eventId_userId: { eventId, userId: user.id } },
    });
    if (existing && !existing.revokedAt)
      throw new HttpError(409, "User is already assigned to this event");
    const pendingByName = await tx.eventStaff.findFirst({
      where: {
        eventId,
        userId: null,
        revokedAt: null,
        staffName: { equals: normalized, mode: "insensitive" },
      },
    });
    let assignment: Awaited<ReturnType<typeof tx.eventStaff.update>>;
    if (existing) {
      assignment = await tx.eventStaff.update({
        where: { id: existing.id },
        data: {
          revokedAt: null,
          staffName: normalized,
          gateLabel: gateLabel?.trim() || null,
          assignedAt: new Date(),
          assignedByUserId: actor.id,
        },
      });
      if (pendingByName) {
        await tx.eventStaff.update({
          where: { id: pendingByName.id },
          data: { revokedAt: new Date() },
        });
      }
    } else if (pendingByName) {
      assignment = await tx.eventStaff.update({
        where: { id: pendingByName.id },
        data: {
          userId: user.id,
          staffName: normalized,
          gateLabel: gateLabel?.trim() || pendingByName.gateLabel,
          assignedByUserId: actor.id,
          assignedAt: new Date(),
        },
      });
    } else {
      assignment = await tx.eventStaff.create({
        data: {
          eventId,
          userId: user.id,
          staffName: normalized,
          gateLabel: gateLabel?.trim() || null,
          assignedByUserId: actor.id,
        },
      });
    }
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

export async function revokeEventStaff(eventId: string, staffRef: string, uid: string) {
  return db.$transaction(async (tx) => {
    const actor = await managerFor(tx, eventId, uid);
    const assignment = await tx.eventStaff.findFirst({
      where: { eventId, OR: [{ id: staffRef }, { userId: staffRef }] },
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
        metadata: { eventId, userId: assignment.userId, staffName: assignment.staffName },
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
