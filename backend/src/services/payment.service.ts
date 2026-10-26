import type { IncomingHttpHeaders } from "node:http";
import { db } from "../config/database.ts";
import { env } from "../config/env.ts";
import { HttpError } from "../middlewares/error.middleware.ts";
import { createNotification } from "./notification.service.ts";
import type { PaymentCheckoutMethod, PaymentProvider } from "./payment-provider.ts";
import { PhajayProvider } from "./phajay-provider.ts";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class PaymentService {
  private provider: PaymentProvider | null = null;

  /** Called by a provider-specific adapter during application startup. */
  registerProvider(provider: PaymentProvider) {
    if (!env.payment.credentialsComplete || env.payment.provider !== provider.id)
      throw new Error("Payment provider does not match complete server configuration");
    this.provider = provider;
  }

  configureFromEnvironment() {
    if (!env.payment.credentialsComplete) return;
    if (env.payment.provider !== "phajay")
      throw new Error(`Unsupported payment provider: ${env.payment.provider}`);
    this.registerProvider(
      new PhajayProvider({
        baseUrl: env.payment.apiBaseUrl,
        apiKey: env.payment.apiKey,
        webhookSecret: env.payment.webhookSecret,
        environment: env.payment.environment,
      }),
    );
  }

  private requireProvider() {
    if (!this.provider) throw new HttpError(503, "Payment provider integration is not configured");
    return this.provider;
  }

  getReadiness() {
    const ready = env.payment.credentialsComplete && this.provider !== null;
    return {
      configured: env.payment.credentialsComplete,
      adapterRegistered: this.provider !== null,
      provider: this.provider?.id ?? null,
      environment: env.payment.environment,
      checkoutEnabled: ready,
      refundsEnabled: ready,
      payout: {
        mode: env.payment.payoutMode,
        providerManaged: ready && env.payment.payoutMode === "split_payment",
        requiresPortalConfiguration: env.payment.payoutMode === "split_payment",
      },
    };
  }

  async createCheckoutForOrder(orderId: string, paymentMethod?: PaymentCheckoutMethod) {
    const provider = this.requireProvider();
    const payment = await db.payment.findFirst({
      where: { orderId },
      include: { order: true },
      orderBy: { createdAt: "desc" },
    });
    if (!payment || payment.state !== "pending" || payment.order.status !== "pending")
      throw new HttpError(409, "Order is not awaiting payment");
    if (payment.order.expiresAt <= new Date()) throw new HttpError(409, "Order has expired");
    const result = await provider.createCheckout({
      merchantReference: payment.order.orderNumber,
      amountKip: payment.amountKip,
      currency: payment.currency,
      idempotencyKey: payment.idempotencyKey,
      returnUrl: "",
      paymentMethod,
    });
    if (result.transactionId)
      await db.payment.update({
        where: { id: payment.id },
        data: { providerTransactionId: result.transactionId },
      });
    return {
      provider: provider.id,
      transactionId: result.transactionId,
      checkoutUrl: result.checkoutUrl,
      qrCode: result.qrCode ?? null,
      expiresAt: payment.order.expiresAt.toISOString(),
    };
  }

  async recordWebhook(
    rawBody: Buffer,
    headers: IncomingHttpHeaders,
  ): Promise<{ txId: string | null; isPaid: boolean; status: string }> {
    const provider = this.requireProvider();
    const verified = await provider.verifyWebhook({
      rawBody,
      headers,
      webhookSecret: env.payment.webhookSecret,
    });
    return db.$transaction(async (tx) => {
      const existing = await tx.payment.findFirst({
        where: {
          provider: provider.id,
          OR: [
            { providerTransactionId: verified.transactionId },
            { order: { orderNumber: verified.merchantReference } },
          ],
        },
        select: { id: true },
      });
      if (!existing) throw new HttpError(404, "Payment order was not found");
      await tx.$queryRaw`SELECT id FROM "Payment" WHERE id = ${existing.id}::uuid FOR UPDATE`;
      const payment = await tx.payment.findUniqueOrThrow({
        where: { id: existing.id },
        include: { order: { include: { user: true } } },
      });
      await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${payment.orderId}::uuid FOR UPDATE`;
      if (verified.amountKip !== payment.amountKip || verified.currency !== payment.currency)
        throw new HttpError(409, "PhaJay payment amount or currency does not match the order");
      if (
        payment.providerTransactionId &&
        payment.providerTransactionId !== verified.transactionId &&
        payment.providerTransactionId !== verified.merchantReference
      )
        throw new HttpError(409, "PhaJay transaction does not match this payment");

      if (verified.outcome === "paid") {
        if (payment.state === "completed")
          return { txId: verified.transactionId, isPaid: true, status: "completed" };
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            providerTransactionId: verified.transactionId,
            state: "completed",
            verifiedAt: new Date(),
          },
        });
        if (payment.order.status === "pending" && payment.order.expiresAt > new Date()) {
          await tx.order.update({
            where: { id: payment.orderId },
            data: { status: "confirmed", paidAt: new Date() },
          });
          await tx.orderItem.updateMany({
            where: { orderId: payment.orderId, status: "pending" },
            data: { status: "valid" },
          });
          await createNotification(
            payment.order.user.authId,
            {
              type: "ticket",
              title: "Payment confirmed",
              message: payment.order.eventTitle,
              data: { orderId: payment.orderId, transactionId: verified.transactionId },
            },
            tx,
          );
        } else if (payment.order.status === "cancelled") {
          const prior = await tx.refund.findFirst({ where: { paymentId: payment.id } });
          if (!prior)
            await tx.refund.create({
              data: {
                paymentId: payment.id,
                amountKip: payment.amountKip,
                currency: payment.currency,
                reason: "Payment completed after the order expired",
              },
            });
        }
        await tx.auditLog.create({
          data: {
            action: "payment.verified",
            entityType: "Payment",
            entityId: payment.id,
            metadata: {
              transactionId: verified.transactionId,
              orderNumber: verified.merchantReference,
            },
          },
        });
        return {
          txId: verified.transactionId,
          isPaid: payment.order.status !== "cancelled",
          status: "completed",
        };
      }

      const state =
        verified.outcome === "refunded"
          ? ("refunded" as const)
          : verified.outcome === "failed"
            ? ("failed" as const)
            : ("pending" as const);
      await tx.payment.update({
        where: { id: payment.id },
        data: { providerTransactionId: verified.transactionId, state },
      });
      return { txId: verified.transactionId, isPaid: false, status: state };
    });
  }

  async executeApprovedRefund(refundId: string, adminUid: string) {
    const provider = this.requireProvider();
    const actor = await db.user.findUnique({ where: { authId: adminUid } });
    if (actor?.role !== "admin") throw new HttpError(403, "Admins only");
    const refund = await db.refund.findUnique({
      where: { id: refundId },
      include: { payment: true },
    });
    if (!refund) throw new HttpError(404, "Refund not found");
    if (refund.status === "succeeded") return refund;
    if (refund.status === "processing") return refund;
    if (refund.status !== "approved") throw new HttpError(409, "Refund is not approved");
    if (!refund.payment.providerTransactionId)
      throw new HttpError(409, "Payment has no provider transaction ID");
    if (refund.amountKip !== refund.payment.amountKip)
      throw new HttpError(422, "PhaJay only supports a full transaction refund");
    const claimed = await db.refund.updateMany({
      where: { id: refund.id, status: "approved" },
      data: { status: "processing" },
    });
    if (claimed.count !== 1) throw new HttpError(409, "Refund execution is already in progress");
    // If the provider received the request but its response is lost, this stays
    // in processing. That fail-safe prevents a duplicate money movement.
    const result = await provider.refund({
      transactionId: refund.payment.providerTransactionId,
      amountKip: refund.amountKip,
      currency: refund.currency,
      idempotencyKey: refund.idempotencyKey,
    });
    return db.$transaction(async (tx) => {
      const updated = await tx.refund.update({
        where: { id: refund.id },
        data: { providerRefundId: result.refundId, status: result.status },
      });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "refund.submitted_to_provider",
          entityType: "Refund",
          entityId: refund.id,
          metadata: { providerRefundId: result.refundId, status: result.status },
        },
      });
      return updated;
    });
  }

  async syncRefund(refundId: string, adminUid: string) {
    const provider = this.requireProvider();
    const refund = await db.refund.findUnique({
      where: { id: refundId },
      include: { payment: true },
    });
    if (!refund) throw new HttpError(404, "Refund not found");
    if (!refund.providerRefundId) throw new HttpError(409, "Refund was not submitted to PhaJay");
    const result = await provider.checkRefund(refund.providerRefundId);
    return db.$transaction(async (tx) => {
      const actor = await tx.user.findUnique({ where: { authId: adminUid } });
      if (actor?.role !== "admin") throw new HttpError(403, "Admins only");
      const updated = await tx.refund.update({
        where: { id: refund.id },
        data: { status: result.status },
      });
      if (result.status === "succeeded") {
        await tx.payment.update({ where: { id: refund.paymentId }, data: { state: "refunded" } });
        await tx.order.update({
          where: { id: refund.payment.orderId },
          data: { status: "refunded" },
        });
        await tx.orderItem.updateMany({
          where: { orderId: refund.payment.orderId },
          data: { status: "refunded" },
        });
      }
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "refund.provider_status_synced",
          entityType: "Refund",
          entityId: refund.id,
          metadata: { providerRefundId: refund.providerRefundId, status: result.status },
        },
      });
      return updated;
    });
  }
  async getPaymentStatus(transactionId: string, uid?: string) {
    if (!uid) throw new HttpError(401, "Sign in to view payment status");
    if (!env.payment.provider)
      throw new HttpError(503, "Payment provider integration is not configured");
    const isUuid = UUID_REGEX.test(transactionId);
    const payment = await db.payment.findFirst({
      where: {
        provider: env.payment.provider,
        order: { user: { authId: uid } },
        OR: [
          { providerTransactionId: transactionId },
          { order: { orderNumber: transactionId } },
          ...(isUuid ? [{ orderId: transactionId }, { id: transactionId }] : []),
        ],
      },
      include: { order: { include: { user: true } } },
    });
    if (!payment) throw new HttpError(404, "Payment not found");

    if (payment.state === "pending" && this.provider && payment.providerTransactionId) {
      try {
        const checked = await this.provider.checkTransaction(payment.providerTransactionId);
        const amountMatches =
          checked.amountKip === undefined || checked.amountKip === payment.amountKip;
        const currencyMatches =
          checked.currency === undefined || checked.currency === payment.currency;
        if (checked.outcome === "paid" && amountMatches && currencyMatches) {
          const settledTxId = checked.transactionId || payment.providerTransactionId;
          await db.$transaction(async (tx) => {
            await tx.$queryRaw`SELECT id FROM "Payment" WHERE id = ${payment.id}::uuid FOR UPDATE`;
            const fresh = await tx.payment.findUniqueOrThrow({
              where: { id: payment.id },
              include: { order: { include: { user: true } } },
            });
            if (fresh.state === "completed") return;
            await tx.payment.update({
              where: { id: fresh.id },
              data: {
                providerTransactionId: settledTxId,
                state: "completed",
                verifiedAt: new Date(),
              },
            });
            if (fresh.order.status === "pending" && fresh.order.expiresAt > new Date()) {
              await tx.order.update({
                where: { id: fresh.orderId },
                data: { status: "confirmed", paidAt: new Date() },
              });
              await tx.orderItem.updateMany({
                where: { orderId: fresh.orderId, status: "pending" },
                data: { status: "valid" },
              });
              await createNotification(
                fresh.order.user.authId,
                {
                  type: "ticket",
                  title: "Payment confirmed",
                  message: fresh.order.eventTitle,
                  data: { orderId: fresh.orderId, transactionId: settledTxId },
                },
                tx,
              );
            }
            await tx.auditLog.create({
              data: {
                action: "payment.verified",
                entityType: "Payment",
                entityId: fresh.id,
                metadata: {
                  transactionId: settledTxId,
                  orderNumber: fresh.order.orderNumber,
                  source: "status_poll",
                },
              },
            });
          });
          return {
            status: "COMPLETED",
            verified: true,
            orderId: payment.orderId,
            orderNumber: payment.order.orderNumber,
          };
        }
      } catch {
        // Ignore transient provider poll errors and return the stored payment state.
      }
    }

    return {
      status: payment.state.toUpperCase(),
      verified: payment.state === "completed" && payment.verifiedAt !== null,
      orderId: payment.orderId,
      orderNumber: payment.order.orderNumber,
    };
  }
}
export const paymentService = new PaymentService();
