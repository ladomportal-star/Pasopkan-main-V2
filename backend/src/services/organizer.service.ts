import { randomBytes } from "node:crypto";
import { db } from "../config/database.ts";
import { HttpError } from "../middlewares/error.middleware.ts";
import { computePayout, DEFAULT_PAYOUT_FEE_PERCENT, getPayoutBillUrl } from "./payout.service.ts";
import type {
  CreateWalkinBody,
  OrganizerAttendeesQuery,
  OrganizerBankDetailsBody,
  RescheduleAttendeeBody,
} from "../validators/organizer.validator.ts";

const paidTicketStatuses = ["valid", "checked_in"] as const;
const LAO_OFFSET_MS = 7 * 60 * 60 * 1000;

function toLaoDate(d: Date): Date {
  return new Date(d.getTime() + LAO_OFFSET_MS);
}

function toLaoDateStr(d: Date): string {
  return toLaoDate(d).toISOString().slice(0, 10);
}

async function assertEventOwnerOrAdmin(eventId: string, uid: string) {
  const [actor, event] = await Promise.all([
    db.user.findUnique({
      where: { authId: uid },
      select: { id: true, role: true },
    }),
    db.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        organizerId: true,
        organizer: { select: { userId: true } },
      },
    }),
  ]);
  if (!actor || !event || (actor.role !== "admin" && event.organizer.userId !== actor.id)) {
    throw new HttpError(403, "Not authorized to manage this event");
  }
  return { actor, event };
}

export async function listOrganizerAttendees(
  eventId: string,
  uid: string,
  query: OrganizerAttendeesQuery,
) {
  await assertEventOwnerOrAdmin(eventId, uid);

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

  const [totalPaid, checkedIn, revenueAgg, couponOrders, rows] = await Promise.all([
    db.orderItem.count({ where: paidWhere }),
    db.orderItem.count({ where: { ...paidWhere, status: "checked_in" } }),
    db.order.aggregate({
      where: { eventId, status: "confirmed" },
      _sum: { totalKip: true },
    }),
    query.cursor
      ? Promise.resolve([])
      : db.order.findMany({
          where: {
            eventId,
            status: "confirmed",
            couponCode: { not: null },
          },
          orderBy: { createdAt: "desc" },
          take: 200,
          select: {
            id: true,
            orderNumber: true,
            eventId: true,
            eventTitle: true,
            couponCode: true,
            discountKip: true,
            totalKip: true,
            buyerName: true,
            buyerEmail: true,
            buyerPhone: true,
            paidAt: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                publicId: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            items: {
              take: 1,
              select: { tierName: true },
            },
          },
        }),
    db.orderItem.findMany({
      where,
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        tierId: true,
        ticketCode: true,
        tierName: true,
        unitPriceKip: true,
        status: true,
        attendeeName: true,
        attendeeEmail: true,
        attendeePhone: true,
        customAnswers: true,
        createdAt: true,
        checkIn: {
          select: {
            checkedInAt: true,
            gate: true,
            staff: { select: { email: true, authId: true } },
          },
        },
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
      checkedInBy: checkIn?.staff?.email ?? checkIn?.staff?.authId ?? null,
    })),
    stats: {
      totalPaid,
      checkedIn,
      notCheckedIn: totalPaid - checkedIn,
      totalIncomeKip: revenueAgg._sum.totalKip ?? 0,
    },
    couponRedemptions: couponOrders.map((o) => {
      const fullName = [o.user.firstName, o.user.lastName].filter(Boolean).join(" ").trim();
      return {
        id: o.id,
        couponCode: o.couponCode!,
        eventId: o.eventId,
        eventTitle: o.eventTitle,
        userId: o.user.publicId || o.user.id.slice(0, 8),
        userName: o.buyerName || fullName || "Attendee",
        userEmail: o.buyerEmail || o.user.email || "",
        userPhone: o.buyerPhone || o.user.phone || "",
        orderId: o.orderNumber,
        tierName: o.items[0]?.tierName || "General",
        discountSaved: o.discountKip,
        totalPaid: o.totalKip,
        usedAt: (o.paidAt ?? o.createdAt).toISOString(),
      };
    }),
    nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
  };
}

export async function rescheduleOrganizerBooking(
  eventId: string,
  itemId: string,
  uid: string,
  body: RescheduleAttendeeBody,
) {
  const { actor } = await assertEventOwnerOrAdmin(eventId, uid);
  return db.$transaction(async (tx) => {
    const item = await tx.orderItem.findUnique({
      where: { id: itemId },
      include: { order: true },
    });
    if (!item || item.order.eventId !== eventId) {
      throw new HttpError(404, "Booking ticket not found for this event");
    }
    const updatedOrder = await tx.order.update({
      where: { id: item.orderId },
      data: {
        selectedDate: body.selectedDate,
        selectedTime: body.selectedTime ?? null,
      },
      select: {
        id: true,
        orderNumber: true,
        selectedDate: true,
        selectedTime: true,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: "booking.rescheduled",
        entityType: "Order",
        entityId: item.orderId,
        metadata: {
          eventId,
          itemId,
          previousDate: item.order.selectedDate,
          previousTime: item.order.selectedTime,
          selectedDate: body.selectedDate,
          selectedTime: body.selectedTime ?? null,
        },
      },
    });
    return { booking: updatedOrder };
  });
}

export async function createOrganizerWalkinBooking(
  eventId: string,
  uid: string,
  body: CreateWalkinBody,
) {
  const { actor, event } = await assertEventOwnerOrAdmin(eventId, uid);
  return db.$transaction(async (tx) => {
    const tiers = await tx.ticketTier.findMany({
      where: { eventId, isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    if (tiers.length === 0) {
      throw new HttpError(409, "Event has no active ticket tiers");
    }
    const tier = (body.tierId ? tiers.find((t) => t.id === body.tierId) : tiers[0]) ?? tiers[0];
    if (tier.quantityTotal != null && tier.quantitySold + body.quantity > tier.quantityTotal) {
      throw new HttpError(409, "Selected ticket tier does not have enough remaining capacity");
    }

    const now = new Date();
    const orderNumber = `WLK-${now.getTime().toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;
    const cleanEmail = body.attendeeEmail?.trim() || null;
    const cleanPhone = body.attendeePhone?.trim() || null;

    // On-site walk-ins are collected directly at the organizer desk (not via PhaJay),
    // so totalKip is recorded as 0 to keep platform online payout accounting exact.
    const order = await tx.order.create({
      data: {
        orderNumber,
        userId: actor.id,
        eventId,
        eventTitle: event.title,
        status: "confirmed",
        subtotalKip: 0,
        discountKip: 0,
        totalKip: 0,
        selectedDate: body.selectedDate,
        selectedTime: body.selectedTime ?? null,
        buyerName: body.attendeeName,
        buyerEmail: cleanEmail,
        buyerPhone: cleanPhone,
        expiresAt: now,
        paidAt: now,
      },
    });

    const createdItems = [];
    for (let i = 0; i < body.quantity; i++) {
      const ticketCode = `tk_walk_${randomBytes(4).toString("hex")}`;
      const item = await tx.orderItem.create({
        data: {
          orderId: order.id,
          tierId: tier.id,
          tierName: tier.name,
          unitPriceKip: tier.priceKip,
          ticketCode,
          status: body.markCheckedIn ? "checked_in" : "valid",
          attendeeName: body.attendeeName,
          attendeeEmail: cleanEmail,
          attendeePhone: cleanPhone,
          customAnswers: {
            booking_type: "On-site Walk-in",
            registered_by: "Organizer Desk",
          },
        },
      });
      if (body.markCheckedIn) {
        await tx.checkIn.create({
          data: {
            orderItemId: item.id,
            checkedInByUserId: actor.id,
            gate: "On-site Walkin Desk",
          },
        });
      }
      createdItems.push(item);
    }

    await tx.ticketTier.update({
      where: { id: tier.id },
      data: { quantitySold: { increment: body.quantity } },
    });

    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: "booking.walkin_created",
        entityType: "Order",
        entityId: order.id,
        metadata: {
          eventId,
          tierId: tier.id,
          quantity: body.quantity,
          selectedDate: body.selectedDate,
          selectedTime: body.selectedTime ?? null,
          markCheckedIn: body.markCheckedIn,
        },
      },
    });

    return { orderNumber: order.orderNumber, items: createdItems };
  });
}

export async function getBookingDayOverrides(eventId: string, uid: string) {
  await assertEventOwnerOrAdmin(eventId, uid);
  const row = await db.siteSetting.findUnique({
    where: { id: `booking_overrides:${eventId}` },
  });
  return { overrides: (row?.data as Record<string, unknown> | null) ?? {} };
}

export async function saveBookingDayOverrides(
  eventId: string,
  uid: string,
  overrides: Record<string, unknown>,
) {
  const { actor } = await assertEventOwnerOrAdmin(eventId, uid);
  const key = `booking_overrides:${eventId}`;
  const saved = await db.$transaction(async (tx) => {
    const row = await tx.siteSetting.upsert({
      where: { id: key },
      create: { id: key, data: overrides as object },
      update: { data: overrides as object },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: "booking.overrides_updated",
        entityType: "Event",
        entityId: eventId,
      },
    });
    return row;
  });
  return { overrides: saved.data };
}

export async function getOrganizerPayoutsAndBank(uid: string) {
  const user = await db.user.findUnique({
    where: { authId: uid },
    include: { organizer: true },
  });
  if (!user) throw new HttpError(401, "Sign in required");

  const organizer = user.organizer;
  const bankAccount =
    organizer?.bankName && organizer?.accountNumber
      ? {
          bankName: organizer.bankName,
          accountName: organizer.accountHolder || organizer.name || "",
          accountNumber: organizer.accountNumber,
          updatedAt: organizer.updatedAt.toISOString(),
        }
      : null;

  if (!organizer && user.role !== "admin") {
    return { bankAccount: null, payouts: [] };
  }

  const events = await db.event.findMany({
    where: organizer ? { organizerId: organizer.id } : {},
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      startDate: true,
      updatedAt: true,
      organizer: {
        select: {
          bankName: true,
          accountHolder: true,
          accountNumber: true,
        },
      },
      payout: true,
    },
  });

  if (events.length === 0) {
    return { bankAccount, payouts: [] };
  }

  const eventIds = events.map((e) => e.id);
  const [grossRows, soldRows] = await Promise.all([
    db.order.groupBy({
      by: ["eventId"],
      where: { status: "confirmed", eventId: { in: eventIds } },
      _sum: { totalKip: true },
    }),
    db.orderItem.findMany({
      where: {
        order: { status: "confirmed", eventId: { in: eventIds } },
        status: { in: [...paidTicketStatuses] },
      },
      select: { order: { select: { eventId: true } } },
    }),
  ]);

  const grossMap = new Map(grossRows.map((r) => [r.eventId, r._sum.totalKip ?? 0]));
  const soldMap = new Map<string, number>();
  for (const item of soldRows) {
    soldMap.set(item.order.eventId, (soldMap.get(item.order.eventId) ?? 0) + 1);
  }

  const payouts = events
    .filter((e) => (grossMap.get(e.id) ?? 0) > 0 || e.payout != null)
    .map((e) => {
      const paid = e.payout?.status === "paid";
      const feePercent = e.payout?.feePercent ?? DEFAULT_PAYOUT_FEE_PERCENT;
      const liveGross = grossMap.get(e.id) ?? 0;
      const grossKip = paid ? (e.payout?.grossKip ?? liveGross) : liveGross;
      const computed = computePayout(grossKip, feePercent);
      return {
        eventId: e.id,
        eventTitle: e.title,
        eventStatus: e.status,
        eventDate: e.startDate ? e.startDate.toISOString().slice(0, 10) : null,
        ticketsSold: soldMap.get(e.id) ?? 0,
        grossKip,
        feePercent,
        feeKip: paid ? (e.payout?.feeKip ?? computed.feeKip) : computed.feeKip,
        payoutKip: paid ? (e.payout?.payoutKip ?? computed.payoutKip) : computed.payoutKip,
        status: (paid ? "paid" : "pending") as "pending" | "paid",
        hasBill: Boolean(e.payout?.billImageRef),
        paidAt: e.payout?.paidAt?.toISOString() ?? null,
        bankName: e.organizer.bankName ?? organizer?.bankName ?? null,
        accountName: e.organizer.accountHolder ?? organizer?.accountHolder ?? null,
        accountNumber: e.organizer.accountNumber ?? organizer?.accountNumber ?? null,
      };
    });

  return { bankAccount, payouts };
}

export async function getOrganizerPayoutBill(uid: string, eventId: string) {
  await assertEventOwnerOrAdmin(eventId, uid);
  return getPayoutBillUrl(eventId);
}

export async function updateOrganizerBankDetails(uid: string, body: OrganizerBankDetailsBody) {
  return db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { authId: uid },
      include: { organizer: true },
    });
    if (!user) throw new HttpError(401, "Sign in required");
    if (user.role !== "organizer" && user.role !== "admin") {
      throw new HttpError(403, "Only approved organizers may configure payout bank details");
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    const updated = user.organizer
      ? await tx.organizer.update({
          where: { id: user.organizer.id },
          data: {
            bankName: body.bankName,
            accountHolder: body.accountHolder,
            accountNumber: body.accountNumber,
          },
        })
      : await tx.organizer.create({
          data: {
            userId: user.id,
            name: fullName || user.email || "Organizer",
            contactEmail: user.email || null,
            contactPhone: user.phone || null,
            bankName: body.bankName,
            accountHolder: body.accountHolder,
            accountNumber: body.accountNumber,
          },
        });

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: "organizer.bank_updated",
        entityType: "Organizer",
        entityId: updated.id,
        metadata: {
          bankName: body.bankName,
          accountHolder: body.accountHolder,
          accountNumberLast4: body.accountNumber.slice(-4),
        },
      },
    });

    return {
      bankAccount: {
        bankName: updated.bankName!,
        accountName: updated.accountHolder!,
        accountNumber: updated.accountNumber!,
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  });
}

export async function getOrganizerAnalytics(uid: string) {
  const user = await db.user.findUnique({
    where: { authId: uid },
    include: { organizer: true },
  });
  if (!user || (user.role !== "organizer" && user.role !== "admin")) {
    return { events: [] };
  }

  const events = await db.event.findMany({
    where: { organizer: { userId: user.id } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      category: true,
      startDate: true,
      maxTicketsPerOrder: true,
      tiers: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          priceKip: true,
          quantityTotal: true,
          quantitySold: true,
        },
      },
      payout: {
        select: {
          feePercent: true,
          status: true,
          grossKip: true,
          payoutKip: true,
        },
      },
    },
  });

  if (events.length === 0) {
    return { events: [] };
  }

  const eventIds = events.map((e) => e.id);
  const orders = await db.order.findMany({
    where: {
      eventId: { in: eventIds },
      status: "confirmed",
    },
    select: {
      id: true,
      eventId: true,
      totalKip: true,
      paidAt: true,
      createdAt: true,
      user: {
        select: {
          gender: true,
          dateOfBirth: true,
        },
      },
      items: {
        where: { status: { in: [...paidTicketStatuses] } },
        select: {
          id: true,
          tierId: true,
          tierName: true,
          unitPriceKip: true,
          status: true,
          checkIn: {
            select: { checkedInAt: true },
          },
        },
      },
    },
  });

  // Build 7-day rolling window in Laos time (ending today)
  const nowLao = toLaoDate(new Date());
  const last7Dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(nowLao);
    d.setUTCDate(d.getUTCDate() - i);
    last7Dates.push(d.toISOString().slice(0, 10));
  }

  const ordersByEvent = new Map<string, typeof orders>();
  for (const order of orders) {
    const list = ordersByEvent.get(order.eventId) ?? [];
    list.push(order);
    ordersByEvent.set(order.eventId, list);
  }

  const currentYear = nowLao.getUTCFullYear();

  const analyticsEvents = events.map((ev) => {
    const evOrders = ordersByEvent.get(ev.id) ?? [];
    let grossRevenue = 0;
    let ticketsSold = 0;
    let checkInCount = 0;

    const tierSoldMap = new Map<string, { sold: number; revenue: number }>();
    const dailyMap = new Map<string, { revenue: number; tickets: number }>();
    for (const dateStr of last7Dates) {
      dailyMap.set(dateStr, { revenue: 0, tickets: 0 });
    }
    let baselineRevenueBeforeWindow = 0;
    let baselineTicketsBeforeWindow = 0;

    const hourlyPurchases24 = Array<number>(24).fill(0);
    const hourlyCheckins24 = Array<number>(24).fill(0);

    let maleCount = 0;
    let femaleCount = 0;
    let unspecifiedGenderCount = 0;
    const ageBuckets: Record<string, { male: number; female: number }> = {
      "18-24": { male: 0, female: 0 },
      "25-34": { male: 0, female: 0 },
      "35-44": { male: 0, female: 0 },
      "45+": { male: 0, female: 0 },
    };

    for (const order of evOrders) {
      grossRevenue += order.totalKip;
      const itemCount = order.items.length;
      ticketsSold += itemCount;

      const orderTime = order.paidAt ?? order.createdAt;
      const orderDateStr = toLaoDateStr(orderTime);
      const orderHour = toLaoDate(orderTime).getUTCHours();
      hourlyPurchases24[orderHour] += itemCount;

      const dayBucket = dailyMap.get(orderDateStr);
      if (dayBucket) {
        dayBucket.revenue += order.totalKip;
        dayBucket.tickets += itemCount;
      } else if (orderDateStr < last7Dates[0]) {
        baselineRevenueBeforeWindow += order.totalKip;
        baselineTicketsBeforeWindow += itemCount;
      }

      const rawGender = (order.user.gender || "").toLowerCase().trim();
      const isMale = rawGender === "male" || rawGender === "m" || rawGender === "ຊາຍ";
      const isFemale = rawGender === "female" || rawGender === "f" || rawGender === "ຍິງ";
      if (isMale) maleCount += itemCount;
      else if (isFemale) femaleCount += itemCount;
      else unspecifiedGenderCount += itemCount;

      if (order.user.dateOfBirth && (isMale || isFemale)) {
        const age = currentYear - order.user.dateOfBirth.getUTCFullYear();
        const bucketKey = age < 25 ? "18-24" : age < 35 ? "25-34" : age < 45 ? "35-44" : "45+";
        if (isMale) ageBuckets[bucketKey].male += itemCount;
        if (isFemale) ageBuckets[bucketKey].female += itemCount;
      }

      for (const item of order.items) {
        const prevTier = tierSoldMap.get(item.tierId) ?? { sold: 0, revenue: 0 };
        prevTier.sold += 1;
        prevTier.revenue += item.unitPriceKip;
        tierSoldMap.set(item.tierId, prevTier);

        if (item.status === "checked_in" || item.checkIn) {
          checkInCount += 1;
          if (item.checkIn?.checkedInAt) {
            const checkinHour = toLaoDate(item.checkIn.checkedInAt).getUTCHours();
            hourlyCheckins24[checkinHour] += 1;
          }
        }
      }
    }

    const tierBreakdown = ev.tiers.map((tier) => {
      const actual = tierSoldMap.get(tier.id);
      const sold = actual ? actual.sold : 0;
      const capacity = tier.quantityTotal ?? Math.max(sold, 0);
      const revenue = actual ? actual.revenue : 0;
      return {
        id: tier.id,
        name: tier.name,
        price: tier.priceKip,
        available: capacity,
        sold,
        revenue,
        fillRate: capacity > 0 ? Math.round((sold / capacity) * 100) : 0,
      };
    });

    const sumTierCapacity = ev.tiers.reduce((acc, t) => acc + (t.quantityTotal ?? 0), 0);
    const totalCapacity = Math.max(sumTierCapacity, ticketsSold);

    const feePercent = ev.payout?.feePercent ?? DEFAULT_PAYOUT_FEE_PERCENT;
    const computedPayout = computePayout(grossRevenue, feePercent);

    let runningRev = baselineRevenueBeforeWindow;
    let runningTix = baselineTicketsBeforeWindow;
    const dailySales = last7Dates.map((dateStr) => {
      const bucket = dailyMap.get(dateStr) ?? { revenue: 0, tickets: 0 };
      runningRev += bucket.revenue;
      runningTix += bucket.tickets;
      const dayOfWeek = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
      return {
        date: dateStr,
        dayOfWeek,
        revenue: bucket.revenue,
        cumulativeRevenue: runningRev,
        tickets: bucket.tickets,
        cumulativeTickets: runningTix,
      };
    });

    return {
      id: ev.id,
      title: ev.title,
      category: ev.category || "Other",
      date: ev.startDate ? ev.startDate.toISOString().slice(0, 10) : "",
      ticketsSold,
      totalCapacity,
      grossRevenue,
      feePercent,
      netPayout: computedPayout.payoutKip,
      checkInCount,
      tierBreakdown,
      dailySales,
      hourlyPurchases24,
      hourlyCheckins24,
      demographics: {
        gender: {
          male: maleCount,
          female: femaleCount,
          unspecified: unspecifiedGenderCount,
        },
        ageGroups: [
          { age: "18-24", male: ageBuckets["18-24"].male, female: ageBuckets["18-24"].female },
          { age: "25-34", male: ageBuckets["25-34"].male, female: ageBuckets["25-34"].female },
          { age: "35-44", male: ageBuckets["35-44"].male, female: ageBuckets["35-44"].female },
          { age: "45+", male: ageBuckets["45+"].male, female: ageBuckets["45+"].female },
        ],
      },
    };
  });

  return { events: analyticsEvents };
}
