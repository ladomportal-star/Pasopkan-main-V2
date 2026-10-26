import { db } from "../config/database.ts";
import { HttpError } from "../middlewares/error.middleware.ts";
import { uploadImage, resolvePrivateImageAsAdmin } from "./media.service.ts";
import { env } from "../config/env.ts";

/** Default platform fee (percent of gross ticket sales) before an admin edits it. */
export const DEFAULT_PAYOUT_FEE_PERCENT = 10;

/** Events that can be paid out: they have sold tickets and are live or finished. */
const PAYABLE_EVENT_STATUSES = ["published", "sold_out", "completed"] as const;

export function computePayout(grossKip: number, feePercent: number) {
  const feeKip = Math.round((grossKip * feePercent) / 100);
  return { feeKip, payoutKip: grossKip - feeKip };
}

type PayoutRow = {
  eventId: string;
  eventTitle: string;
  eventStatus: string;
  organizer: {
    id: string;
    name: string;
    bankName: string | null;
    accountNumber: string | null;
    accountHolder: string | null;
  };
  grossKip: number;
  feePercent: number;
  feeKip: number;
  payoutKip: number;
  status: "pending" | "paid";
  hasBill: boolean;
  paidAt: string | null;
};

/** Gross sales per event = confirmed orders only (refunded/cancelled are excluded). */
async function confirmedGrossByEvent(eventIds?: string[]) {
  const rows = await db.order.groupBy({
    by: ["eventId"],
    where: { status: "confirmed", ...(eventIds ? { eventId: { in: eventIds } } : {}) },
    _sum: { totalKip: true },
  });
  return new Map(rows.map((row) => [row.eventId, row._sum.totalKip ?? 0]));
}

export async function listPayouts(): Promise<PayoutRow[]> {
  const gross = await confirmedGrossByEvent();
  const eventIds = [...gross.entries()].filter(([, total]) => total > 0).map(([id]) => id);
  if (eventIds.length === 0) return [];
  const events = await db.event.findMany({
    where: { id: { in: eventIds }, status: { in: [...PAYABLE_EVENT_STATUSES] } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      organizer: {
        select: { id: true, name: true, bankName: true, accountNumber: true, accountHolder: true },
      },
      payout: true,
    },
  });
  return events.map((event) => {
    const paid = event.payout?.status === "paid";
    const feePercent = event.payout?.feePercent ?? DEFAULT_PAYOUT_FEE_PERCENT;
    const liveGross = gross.get(event.id) ?? 0;
    // Paid payouts keep the amounts frozen at payment time.
    const grossKip = paid ? (event.payout?.grossKip ?? liveGross) : liveGross;
    const computed = computePayout(grossKip, feePercent);
    return {
      eventId: event.id,
      eventTitle: event.title,
      eventStatus: event.status,
      organizer: event.organizer,
      grossKip,
      feePercent,
      feeKip: paid ? (event.payout?.feeKip ?? computed.feeKip) : computed.feeKip,
      payoutKip: paid ? (event.payout?.payoutKip ?? computed.payoutKip) : computed.payoutKip,
      status: paid ? "paid" : "pending",
      hasBill: Boolean(event.payout?.billImageRef),
      paidAt: event.payout?.paidAt?.toISOString() ?? null,
    };
  });
}

async function requirePayableEvent(eventId: string) {
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { id: true, status: true },
  });
  if (!event) throw new HttpError(404, "Event not found");
  const gross = (await confirmedGrossByEvent([eventId])).get(eventId) ?? 0;
  if (!(PAYABLE_EVENT_STATUSES as readonly string[]).includes(event.status) || gross <= 0)
    throw new HttpError(409, "This event has no payable sales");
  return gross;
}

export async function updatePayoutFee(adminUid: string, eventId: string, feePercent: number) {
  await requirePayableEvent(eventId);
  await db.$transaction(async (tx) => {
    const [actor, existing] = await Promise.all([
      tx.user.findUnique({ where: { authId: adminUid } }),
      tx.eventPayout.findUnique({ where: { eventId } }),
    ]);
    if (!actor || actor.role !== "admin") throw new HttpError(403, "Admins only");
    if (existing?.status === "paid")
      throw new HttpError(409, "A paid payout's fee can no longer be changed");
    await tx.eventPayout.upsert({
      where: { eventId },
      create: { eventId, feePercent },
      update: { feePercent },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: "payout.fee_updated",
        entityType: "Event",
        entityId: eventId,
        metadata: { previousFeePercent: existing?.feePercent ?? null, feePercent },
      },
    });
  });
}

/**
 * Attaches a proof-of-transfer bill. The first bill marks the payout as paid and
 * freezes gross/fee/payout; later uploads only replace the bill image.
 */
export async function attachPayoutBill(adminUid: string, eventId: string, dataUrl: string) {
  if (env.payment.credentialsComplete && env.payment.payoutMode === "split_payment")
    throw new HttpError(
      409,
      "This payout is managed by PhaJay Split Payment; do not record a second manual transfer",
    );
  const gross = await requirePayableEvent(eventId);
  const reference = await uploadImage(adminUid, dataUrl, "private");
  await db.$transaction(async (tx) => {
    const [actor, existing] = await Promise.all([
      tx.user.findUnique({ where: { authId: adminUid } }),
      tx.eventPayout.findUnique({ where: { eventId } }),
    ]);
    if (!actor || actor.role !== "admin") throw new HttpError(403, "Admins only");
    const firstPayment = existing?.status !== "paid";
    const feePercent = existing?.feePercent ?? DEFAULT_PAYOUT_FEE_PERCENT;
    const amounts = computePayout(gross, feePercent);
    await tx.eventPayout.upsert({
      where: { eventId },
      create: {
        eventId,
        feePercent,
        status: "paid",
        grossKip: gross,
        feeKip: amounts.feeKip,
        payoutKip: amounts.payoutKip,
        billImageRef: reference,
        paidAt: new Date(),
        paidByUserId: actor.id,
      },
      update: firstPayment
        ? {
            status: "paid",
            grossKip: gross,
            feeKip: amounts.feeKip,
            payoutKip: amounts.payoutKip,
            billImageRef: reference,
            paidAt: new Date(),
            paidByUserId: actor.id,
          }
        : { billImageRef: reference },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: firstPayment ? "payout.marked_paid" : "payout.bill_replaced",
        entityType: "Event",
        entityId: eventId,
        metadata: { feePercent, grossKip: gross, payoutKip: amounts.payoutKip },
      },
    });
  });
}

export async function getPayoutBillUrl(eventId: string) {
  const payout = await db.eventPayout.findUnique({
    where: { eventId },
    select: { billImageRef: true },
  });
  if (!payout?.billImageRef) throw new HttpError(404, "No bill image uploaded");
  return resolvePrivateImageAsAdmin(payout.billImageRef);
}
