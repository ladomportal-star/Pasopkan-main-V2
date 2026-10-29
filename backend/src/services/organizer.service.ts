import { db } from "../config/database.ts";
import { HttpError } from "../middlewares/error.middleware.ts";
import type { OrganizerAttendeesQuery } from "../validators/organizer.validator.ts";

const paidTicketStatuses = ["valid", "checked_in"] as const;

export async function listOrganizerAttendees(
  eventId: string,
  uid: string,
  query: OrganizerAttendeesQuery,
) {
  const actor = await db.user.findUnique({ where: { authId: uid }, select: { id: true, role: true } });
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { id: true, organizer: { select: { userId: true } } },
  });
  // Attendee contact details are private: only the event owner and platform admins can view them.
  if (!actor || !event || (actor.role !== "admin" && event.organizer.userId !== actor.id)) {
    throw new HttpError(403, "Not authorized to view attendees for this event");
  }

  const search = query.q?.trim();
  const paidWhere = {
    order: { eventId, status: "confirmed" as const },
    status: { in: [...paidTicketStatuses] },
  };
  const where = {
    ...paidWhere,
    ...(search
      ? {
          OR: [
            { ticketCode: { contains: search, mode: "insensitive" as const } },
            { attendeeName: { contains: search, mode: "insensitive" as const } },
            { attendeeEmail: { contains: search, mode: "insensitive" as const } },
            { attendeePhone: { contains: search, mode: "insensitive" as const } },
            { order: { orderNumber: { contains: search, mode: "insensitive" as const } } },
            { order: { buyerName: { contains: search, mode: "insensitive" as const } } },
            { order: { buyerEmail: { contains: search, mode: "insensitive" as const } } },
            { order: { buyerPhone: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [totalPaid, checkedIn, rows] = await Promise.all([
    db.orderItem.count({ where: paidWhere }),
    db.orderItem.count({ where: { ...paidWhere, status: "checked_in" } }),
    db.orderItem.findMany({
      where,
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        ticketCode: true,
        tierName: true,
        unitPriceKip: true,
        status: true,
        attendeeName: true,
        attendeeEmail: true,
        attendeePhone: true,
        customAnswers: true,
        createdAt: true,
        checkIn: { select: { checkedInAt: true, gate: true } },
        order: {
          select: {
            orderNumber: true,
            buyerName: true,
            buyerEmail: true,
            buyerPhone: true,
            selectedDate: true,
            selectedTime: true,
            paidAt: true,
          },
        },
      },
    }),
  ]);

  const hasMore = rows.length > query.limit;
  const page = hasMore ? rows.slice(0, query.limit) : rows;
  return {
    attendees: page.map(({ order, checkIn, ...ticket }) => ({
      ...ticket,
      attendeeName: ticket.attendeeName ?? order.buyerName,
      attendeeEmail: ticket.attendeeEmail ?? order.buyerEmail,
      attendeePhone: ticket.attendeePhone ?? order.buyerPhone,
      orderNumber: order.orderNumber,
      selectedDate: order.selectedDate,
      selectedTime: order.selectedTime,
      paidAt: order.paidAt,
      checkedInAt: checkIn?.checkedInAt ?? null,
      gate: checkIn?.gate ?? null,
    })),
    stats: { totalPaid, checkedIn, notCheckedIn: totalPaid - checkedIn },
    nextCursor: hasMore ? page.at(-1)?.id ?? null : null,
  };
}
