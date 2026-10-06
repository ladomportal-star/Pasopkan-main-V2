import { db } from "../config/database.ts";
import { HttpError } from "../middlewares/error.middleware.ts";
import { getOrCreateUser } from "./user.service.ts";

export async function applyAsOrganizer(uid: string, name: string, description?: string) {
  const user = await getOrCreateUser(uid);
  if (await db.organizer.findUnique({ where: { userId: user.id } })) throw new HttpError(409, "Already an organizer");
  return db.organizerApplication.create({ data: { userId: user.id, name, description } });
}

export async function reviewOrganizer(uid: string, id: string, approve: boolean, reason?: string) {
  return db.$transaction(async tx => {
    const admin = await tx.user.findUnique({ where: { authId: uid } });
    if (admin?.role !== "admin") throw new HttpError(403, "Admins only");
    await tx.$queryRaw`SELECT id FROM "OrganizerApplication" WHERE id = ${id}::uuid FOR UPDATE`;
    const application = await tx.organizerApplication.findUnique({ where: { id } });
    if (!application) throw new HttpError(404, "Application not found");
    if (application.status !== "pending") throw new HttpError(409, "Application already reviewed");
    if (!approve && !reason?.trim()) throw new HttpError(400, "Rejection reason is required");
    const row = await tx.organizerApplication.update({ where: { id }, data: { status: approve ? "approved" : "rejected", reviewedByUserId: admin.id, reviewedAt: new Date(), rejectionReason: approve ? null : reason } });
    if (approve) {
      await tx.organizer.create({ data: { userId: application.userId, name: application.name, description: application.description } });
      await tx.user.updateMany({ where: { id: application.userId, role: "user" }, data: { role: "organizer" } });
    }
    await tx.auditLog.create({ data: { actorId: admin.id, action: approve ? "organizer.approved" : "organizer.rejected", entityType: "OrganizerApplication", entityId: id } });
    return row;
  });
}

export async function cancelEvent(uid: string, id: string) {
  return db.$transaction(async tx => {
    const admin = await tx.user.findUnique({ where: { authId: uid } });
    if (admin?.role !== "admin") throw new HttpError(403, "Admins only");
    await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${id}::uuid FOR UPDATE`;
    const event = await tx.event.findUnique({ where: { id } });
    if (!event) throw new HttpError(404, "Event not found");
    if (event.status === "cancelled") return event;
    const payments = await tx.payment.findMany({ where: { order: { eventId: id }, state: "completed" } });
    for (const payment of payments) {
      // Lock the payment so concurrent refund approval cannot exceed the amount.
      await tx.$queryRaw`SELECT id FROM "Payment" WHERE id = ${payment.id}::uuid FOR UPDATE`;
      const reserved = await tx.refund.aggregate({ where: { paymentId: payment.id, status: { notIn: ["rejected", "failed"] } }, _sum: { amountKip: true } });
      const remaining = payment.amountKip - (reserved._sum.amountKip ?? 0);
      if (remaining > 0) await tx.refund.create({ data: { paymentId: payment.id, amountKip: remaining, reason: "Event cancelled" } });
    }
    await tx.orderItem.updateMany({ where: { order: { eventId: id }, status: { in: ["pending", "valid"] } }, data: { status: "void" } });
    await tx.order.updateMany({ where: { eventId: id, status: "pending" }, data: { expiresAt: new Date() } });
    const result = await tx.event.update({ where: { id }, data: { status: "cancelled" } });
    await tx.auditLog.create({ data: { actorId: admin.id, action: "event.cancelled", entityType: "Event", entityId: id } });
    return result;
  });
}

export async function approveRefund(uid: string, id: string) {
  return db.$transaction(async tx => {
    const admin = await tx.user.findUnique({ where: { authId: uid } });
    if (admin?.role !== "admin") throw new HttpError(403, "Admins only");
    const initial = await tx.refund.findUnique({ where: { id } });
    if (!initial) throw new HttpError(404, "Refund not found");
    await tx.$queryRaw`SELECT id FROM "Payment" WHERE id = ${initial.paymentId}::uuid FOR UPDATE`;
    const refund = await tx.refund.findUniqueOrThrow({ where: { id }, include: { payment: true } });
    if (refund.status !== "pending_approval") throw new HttpError(409, "Refund already reviewed");
    if (refund.payment.state !== "completed") throw new HttpError(409, "Payment is not settled");
    const reserved = await tx.refund.aggregate({ where: { paymentId: refund.paymentId, id: { not: id }, status: { in: ["approved", "processing", "succeeded"] } }, _sum: { amountKip: true } });
    if ((reserved._sum.amountKip ?? 0) + refund.amountKip > refund.payment.amountKip) throw new HttpError(409, "Refund exceeds remaining paid amount");
    const result = await tx.refund.update({ where: { id }, data: { status: "approved", reviewedAt: new Date(), reviewedByUserId: admin.id } });
    await tx.auditLog.create({ data: { actorId: admin.id, action: "refund.approved", entityType: "Refund", entityId: id } });
    // Approval is not a money transfer. A configured provider worker must execute it later.
    return result;
  });
}
