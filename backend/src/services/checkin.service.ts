import { db } from "../config/database.ts";
import { HttpError } from "../middlewares/error.middleware.ts";
import type { CreateCheckinBody } from "../validators/checkin.validator.ts";
import type { Prisma } from "../lib/prisma.ts";
async function staffFor(tx: Prisma.TransactionClient, eventId: string, uid: string) {
  const actor = await tx.user.findUnique({ where: { authId: uid } });
  const event = await tx.event.findUnique({ where: { id: eventId }, include: { organizer: true } });
  if (!actor || !event) throw new HttpError(403, "Not authorized to scan this event");
  if (
    actor.role !== "admin" &&
    (actor.role !== "organizer" || event.organizer.userId !== actor.id)
  ) {
    const assignment = await tx.eventStaff.findUnique({
      where: { eventId_userId: { eventId, userId: actor.id } },
    });
    if (!assignment || assignment.revokedAt)
      throw new HttpError(403, "Not assigned as staff for this event");
  }
  return actor;
}
const include = { order: true, checkIn: { include: { staff: true } } } as const;
type TicketFinder = Pick<Prisma.TransactionClient, "orderItem">;

async function findTicketItem(exec: TicketFinder, ticketCode: string) {
  const exact = await exec.orderItem.findUnique({ where: { ticketCode }, include });
  if (exact) return exact;

  // Older tickets included a UUID after this compact prefix. Keep those QR
  // codes valid while allowing staff to enter the shorter printed ID.
  if (!/^PSK-\d{12}-\d+$/i.test(ticketCode)) return null;
  const matches = await exec.orderItem.findMany({
    where: { ticketCode: { startsWith: `${ticketCode}-` } },
    take: 2,
    include,
  });
  return matches.length === 1 ? matches[0] : null;
}

function checkinApi(row: any, item: any) {
  const { staff, ...fields } = row;
  return {
    ...fields,
    ticketCode: item.ticketCode,
    eventId: item.order.eventId,
    attendeeName: item.attendeeName ?? item.order.buyerName,
    attendeeEmail: item.attendeeEmail ?? item.order.buyerEmail ?? null,
    attendeePhone: item.attendeePhone ?? item.order.buyerPhone ?? null,
    ticketType: item.tierName,
    unitPriceKip: item.unitPriceKip ?? 0,
    customAnswers: item.customAnswers ?? null,
    checkedInBy: staff?.email ?? staff?.authId,
  };
}
export async function scanTicket(body: CreateCheckinBody, uid: string) {
  return db.$transaction(async (tx) => {
    // Authorize the requested event before revealing anything about a ticket code.
    const staff = await staffFor(tx, body.eventId, uid);
    const item = await findTicketItem(tx, body.ticketCode);
    if (!item) throw new HttpError(404, "Ticket not found");
    if (body.eventId !== item.order.eventId)
      throw new HttpError(409, "Ticket belongs to another event");
    // Lock and re-read before deciding; payment/refund may have changed its state.
    await tx.$queryRaw`SELECT id FROM "OrderItem" WHERE id = ${item.id}::uuid FOR UPDATE`;
    const current = await tx.orderItem.findUniqueOrThrow({ where: { id: item.id }, include });
    if (current.order.status !== "confirmed")
      throw new HttpError(409, "This ticket has not been paid for");
    if (current.status === "void" || current.status === "refunded" || current.status === "pending")
      throw new HttpError(409, "Ticket is not valid");
    const existing = await tx.checkIn.findUnique({
      where: { orderItemId: item.id },
      include: { staff: true },
    });
    if (existing)
      return { status: "already_checked_in" as const, checkIn: checkinApi(existing, current) };
    if (current.status !== "valid") throw new HttpError(409, "Ticket has already been used");
    const row = await tx.checkIn.create({
      data: { orderItemId: item.id, checkedInByUserId: staff.id, gate: body.gate, note: body.note },
      include: { staff: true },
    });
    await tx.orderItem.update({ where: { id: item.id }, data: { status: "checked_in" } });
    return { status: "checked_in" as const, checkIn: checkinApi(row, current) };
  });
}
export async function listCheckins(eventId: string, uid: string) {
  await staffFor(db, eventId, uid);
  const rows = await db.checkIn.findMany({
    where: { orderItem: { order: { eventId } } },
    include: { staff: true, orderItem: { include: { order: true } } },
    orderBy: { checkedInAt: "desc" },
  });
  return rows.map((row) => checkinApi(row, row.orderItem));
}
export async function lookupTicket(ticketCode: string, uid: string) {
  const item = await findTicketItem(db, ticketCode);
  if (!item) return null;
  await staffFor(db, item.order.eventId, uid);
  return {
    ticketCode,
    itemStatus: item.status,
    orderStatus: item.order.status,
    eventId: item.order.eventId,
    eventTitle: item.order.eventTitle,
    orderCreatedAt: item.order.createdAt,
    tierName: item.tierName,
    unitPriceKip: item.unitPriceKip,
    attendeeName: item.attendeeName ?? item.order.buyerName,
    attendeeEmail: item.attendeeEmail ?? item.order.buyerEmail ?? null,
    attendeePhone: item.attendeePhone ?? item.order.buyerPhone ?? null,
    customAnswers: item.customAnswers,
    alreadyCheckedIn: !!item.checkIn,
    checkedInAt: item.checkIn?.checkedInAt ?? null,
    checkedInBy: item.checkIn?.staff?.email ?? item.checkIn?.staff?.authId ?? null,
    gate: item.checkIn?.gate ?? null,
  };
}
