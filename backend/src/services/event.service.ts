import { db } from "../config/database.ts";
import type { Prisma } from "../lib/prisma.ts";
import { assertMediaReferences } from "./media.service.ts";
import { HttpError } from "../middlewares/error.middleware.ts";
import { consumeSubmissionOtp, validateSubmissionOtp } from "./event-submission-otp.service.ts";
import type { CreateEventBody, UpdateEventBody } from "../validators/event.validator.ts";
import { registrationQuestions } from "./event-registration.ts";
import { createNotification } from "./notification.service.ts";
const publicInclude = {
  tiers: { orderBy: { sortOrder: "asc" } },
  dates: { orderBy: { date: "asc" } },
  coupons: true,
  organizer: true,
} as const;
const ownerInclude = { ...publicInclude, privateDetails: true } as const;
const registrationInclude = {
  ...publicInclude,
  privateDetails: {
    select: { attendeeQuestions: true, ticketSaleWindows: true, bookingSlotCapacities: true },
  },
} as const;
function publicRegistration<
  T extends {
    privateDetails?: {
      attendeeQuestions: unknown;
      ticketSaleWindows: unknown;
      bookingSlotCapacities: unknown;
    } | null;
  },
>(event: T) {
  const { privateDetails, ...row } = event;
  return {
    ...row,
    attendeeQuestions: registrationQuestions(privateDetails?.attendeeQuestions),
    ticketSaleWindows: privateDetails?.ticketSaleWindows ?? [],
    bookingSlotCapacities: privateDetails?.bookingSlotCapacities ?? {},
  };
}
const publicStates = ["published", "sold_out", "completed"] as const;
const refWhere = (ref: string) => (/^[0-9a-f-]{36}$/i.test(ref) ? { id: ref } : { slug: ref });
function columns(body: Partial<CreateEventBody>) {
  const {
    organizer: _o,
    privateDetails: _p,
    tiers: _t,
    dates: _d,
    coupons: _c,
    legacyId: _l,
    termsAccepted: _terms,
    submissionOtp: _otp,
    startDate,
    endDate,
    ...rest
  } = body;
  return {
    ...rest,
    ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
    ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
  };
}
async function children(
  tx: Prisma.TransactionClient,
  eventId: string,
  body: Partial<CreateEventBody>,
) {
  if (body.tiers?.length)
    await tx.ticketTier.createMany({ data: body.tiers.map((t) => ({ ...t, eventId })) });
  if (body.dates?.length)
    await tx.eventDate.createMany({
      data: body.dates.map((d) => ({ ...d, date: new Date(d.date), eventId })),
    });
  if (body.coupons?.length)
    await tx.coupon.createMany({ data: body.coupons.map((c) => ({ ...c, eventId })) });
}
async function savePrivateDetails(
  tx: Prisma.TransactionClient,
  eventId: string,
  details: CreateEventBody["privateDetails"],
) {
  if (!details) return;
  const data = {
    ...details,
    bookingSlotCapacities: details.bookingSlotCapacities ?? undefined,
    attendeeQuestions: details.attendeeQuestions as Prisma.InputJsonValue | undefined,
    ticketSaleWindows: details.ticketSaleWindows as Prisma.InputJsonValue | undefined,
    organizerSocialLinks: details.organizerSocialLinks ?? undefined,
  };
  await tx.eventPrivateDetails.upsert({
    where: { eventId },
    create: { ...data, eventId },
    update: data,
  });
}
export async function createEvent(body: CreateEventBody, uid: string) {
  if (body.rejectionReason)
    throw new HttpError(400, "Review reasons cannot be set when creating events");
  assertMediaReferences(
    [body.coverImageUrl, body.galleryUrls, body.zoneImageUrl, body.organizer?.logoUrl],
    uid,
    "public",
  );
  const role = await db.user.findUnique({
    where: { authId: uid },
    select: { role: true, organizerTermsAcceptedAt: true },
  });
  const submitting = role?.role === "organizer" && body.status === "pending_review";
  if (role?.role === "organizer" && !role.organizerTermsAcceptedAt && !body.termsAccepted)
    throw new HttpError(400, "Accept the organizer terms before creating an event");
  const otp = submitting ? await validateSubmissionOtp(uid, body.submissionOtp) : null;
  return db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { authId: uid }, include: { organizer: true } });
    if (!user) throw new HttpError(403, "A registered account is required");
    if (user.role !== "admin" && (user.role !== "organizer" || !user.organizer))
      throw new HttpError(403, "An approved organizer profile is required");
    if (user.role === "organizer" && body.termsAccepted && !user.organizerTermsAcceptedAt)
      await tx.user.updateMany({
        where: { id: user.id, organizerTermsAcceptedAt: null },
        data: { organizerTermsAcceptedAt: new Date() },
      });
    if (!["draft", "pending_review"].includes(body.status ?? "draft"))
      throw new HttpError(403, "Submit the event for admin review before publication");
    // An event always has an organizer for ownership and accounting. Admins do not
    // need to apply for that role; provision their owner record without changing role.
    const organizer =
      user.organizer ??
      (await tx.organizer.upsert({
        where: { userId: user.id },
        create: { userId: user.id, name: "Pasopkan Admin" },
        update: {},
      }));
    const event = await tx.event.create({
      data: { ...columns(body), title: body.title, organizerId: organizer.id },
    });
    await children(tx, event.id, body);
    await savePrivateDetails(tx, event.id, body.privateDetails);
    if (otp) await consumeSubmissionOtp(tx, otp);
    if (body.termsAccepted) {
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "event.terms_accepted",
          entityType: "Event",
          entityId: event.id,
          metadata: { at: new Date().toISOString() },
        },
      });
    }
    if (body.organizer)
      await tx.organizer.update({ where: { id: organizer.id }, data: body.organizer });
    return tx.event.findUnique({ where: { id: event.id }, include: ownerInclude });
  });
}
export async function updateEvent(ref: string, patch: UpdateEventBody, uid: string) {
  assertMediaReferences(
    [patch.coverImageUrl, patch.galleryUrls, patch.zoneImageUrl, patch.organizer?.logoUrl],
    uid,
    "public",
  );
  const [actorRole, currentEvent] = await Promise.all([
    db.user.findUnique({
      where: { authId: uid },
      select: { role: true, organizerTermsAcceptedAt: true },
    }),
    db.event.findFirst({ where: refWhere(ref), select: { status: true } }),
  ]);
  const submitting =
    actorRole?.role === "organizer" &&
    (patch.status === "pending_review" || currentEvent?.status === "published");
  if (submitting && !actorRole?.organizerTermsAcceptedAt && !patch.termsAccepted)
    throw new HttpError(400, "Accept the organizer terms before submitting an event");
  const otp = submitting ? await validateSubmissionOtp(uid, patch.submissionOtp) : null;
  return db.$transaction(async (tx) => {
    const event = await tx.event.findFirst({ where: refWhere(ref), include: { organizer: true } });
    if (!event) return null;
    const [locked] = await tx.$queryRaw<
      Array<{ status: string }>
    >`SELECT status FROM "Event" WHERE id = ${event.id}::uuid FOR UPDATE`;
    if (!locked) return null;
    event.status = locked.status as typeof event.status;
    const actor = await tx.user.findUnique({ where: { authId: uid } });
    if (
      !actor ||
      (actor.role !== "admin" &&
        (actor.role !== "organizer" || event.organizer.userId !== actor.id))
    )
      throw new HttpError(403, "You do not have permission to modify this event");
    if (actor.role === "organizer" && patch.termsAccepted && !actor.organizerTermsAcceptedAt)
      await tx.user.updateMany({
        where: { id: actor.id, organizerTermsAcceptedAt: null },
        data: { organizerTermsAcceptedAt: new Date() },
      });
    if (
      actor.role === "organizer" &&
      (patch.status === "pending_review" || event.status === "published") &&
      !otp
    )
      throw new HttpError(403, "Event submission requires a fresh phone OTP");
    if (["cancelled", "completed"].includes(event.status))
      throw new HttpError(409, "Closed events cannot be modified or reopened");
    if (
      patch.status &&
      !["draft", "pending_review"].includes(patch.status) &&
      actor.role !== "admin"
    )
      throw new HttpError(403, "Admin review is required");
    if (patch.status === "published" && event.status !== "pending_review")
      throw new HttpError(409, "Event must be submitted for review");
    if (
      patch.status === "rejected" &&
      (event.status !== "pending_review" || !patch.rejectionReason?.trim())
    )
      throw new HttpError(400, "Reject a submitted event with a reason");
    if (patch.rejectionReason && actor.role !== "admin")
      throw new HttpError(403, "Only admins may set review reasons");
    if (patch.status === "cancelled")
      throw new HttpError(409, "Use the audited cancellation workflow");
    if (patch.tiers !== undefined && (await tx.order.count({ where: { eventId: event.id } })))
      throw new HttpError(409, "Ticket tiers cannot be replaced after orders exist");
    const data = columns(patch);
    if (patch.status === "published" || patch.status === "pending_review")
      Object.assign(data, { rejectionReason: null });
    if (actor.role !== "admin" && event.status === "published") data.status = "pending_review";
    await tx.event.update({ where: { id: event.id }, data });
    if (patch.tiers !== undefined) await tx.ticketTier.deleteMany({ where: { eventId: event.id } });
    if (patch.dates !== undefined) await tx.eventDate.deleteMany({ where: { eventId: event.id } });
    if (patch.coupons !== undefined) await tx.coupon.deleteMany({ where: { eventId: event.id } });
    await children(tx, event.id, patch);
    await savePrivateDetails(tx, event.id, patch.privateDetails);
    if (otp) {
      await consumeSubmissionOtp(tx, otp);
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "event.terms_accepted",
          entityType: "Event",
          entityId: event.id,
          metadata: { at: new Date().toISOString() },
        },
      });
    }
    if (patch.organizer)
      await tx.organizer.update({ where: { id: event.organizerId }, data: patch.organizer });
    if (data.status && data.status !== event.status) {
      if (actor.role === "admin" && ["published", "rejected"].includes(patch.status))
        await tx.event.update({
          where: { id: event.id },
          data: { reviewedByUserId: actor.id, reviewedAt: new Date() },
        });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "event.status",
          entityType: "Event",
          entityId: event.id,
          metadata: { before: event.status, after: data.status },
        },
      });

      if (actor.role === "admin" && ["published", "rejected"].includes(data.status)) {
        const organizerUser = await tx.user.findUnique({
          where: { id: event.organizer.userId },
          select: { authId: true },
        });
        if (organizerUser?.authId) {
          const approved = data.status === "published";
          await createNotification(organizerUser.authId, {
            type: approved ? "verified" : "system",
            title: approved ? "Event approved" : "Event needs changes",
            titleLo: approved ? "ກິດຈະກຳຜ່ານການອະນຸມັດ" : "ກິດຈະກຳຕ້ອງປັບປຸງ",
            message: approved
              ? `Your event “${event.title}” is now published.`
              : `Your event “${event.title}” was rejected. Reason: ${patch.rejectionReason ?? "Please review and update your event."}`,
            messageLo: approved
              ? `ກິດຈະກຳ “${event.title}” ຂອງທ່ານໄດ້ຮັບອະນຸມັດແລະເຜີຍແຜ່ແລ້ວ.`
              : `ກິດຈະກຳ “${event.title}” ຖືກປະຕິເສດ: ${patch.rejectionReason ?? "ກະລຸນາກວດສອບແລະແກ້ໄຂ."}`,
            data: {
              eventId: event.id,
              status: approved ? "approved" : "rejected",
              ...(!approved && patch.rejectionReason ? { rejectionReason: patch.rejectionReason } : {}),
            },
          }, tx);
        }
      } else if (actor.role === "organizer" && data.status === "pending_review") {
        const admins = await tx.user.findMany({
          where: { role: "admin" },
          select: { authId: true },
        });
        await Promise.all(admins.map((admin) =>
          createNotification(admin.authId, {
            type: "noted",
            title: "Event submitted for review",
            titleLo: "ມີກິດຈະກຳລໍຖ້າກວດສອບ",
            message: `Organizer submitted “${event.title}” for review.`,
            messageLo: `Organizer ໄດ້ສົ່ງ “${event.title}” ເພື່ອກວດສອບ.`,
            data: { eventId: event.id, status: data.status },
          }, tx),
        ));
      }
    }
    return tx.event.findUnique({ where: { id: event.id }, include: ownerInclude });
  });
}
export async function listEvents(query: {
  status?: string;
  mine?: boolean;
  viewerUid?: string;
  cursor?: string;
  limit: number;
}) {
  if (query.mine && !query.viewerUid) throw new HttpError(401, "Sign in to list your events");
  if (query.mine) {
    const viewer = await db.user.findUnique({
      where: { authId: query.viewerUid! },
      select: { role: true },
    });
    if (viewer?.role !== "organizer" && viewer?.role !== "admin")
      return { events: [], nextCursor: null };
  }
  const where: Prisma.EventWhereInput = query.mine
    ? { organizer: { user: { authId: query.viewerUid } } }
    : { status: { in: [...publicStates] }, eventPrivacy: "public" };
  const rows = await db.event.findMany({
    where: { AND: [where, ...(query.status ? [{ status: query.status as any }] : [])] },
    include: query.mine ? ownerInclude : registrationInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  });
  const events = rows
    .slice(0, query.limit)
    .map((row) => (query.mine ? row : publicRegistration(row)));
  return { events, nextCursor: rows.length > query.limit ? (events.at(-1)?.id ?? null) : null };
}
export async function getEvent(ref: string, uid?: string) {
  const event = await db.event.findFirst({ where: refWhere(ref), include: registrationInclude });
  if (!event) return null;
  const actor = uid ? await db.user.findUnique({ where: { authId: uid } }) : null;
  const ownsEvent =
    !!actor &&
    (actor.role === "admin" || (actor.role === "organizer" && event.organizer.userId === actor.id));
  if (ownsEvent) return db.event.findUnique({ where: { id: event.id }, include: ownerInclude });
  if (
    event.eventPrivacy !== "public" ||
    !(publicStates as readonly string[]).includes(event.status)
  )
    return null;
  return publicRegistration(event);
}
