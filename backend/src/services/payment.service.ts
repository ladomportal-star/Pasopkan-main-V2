import { eq } from "drizzle-orm";
import { db } from "../config/database.ts";
import { payments } from "../models/schema.ts";
import { logger } from "../utils/logger.ts";
import { confirmOrderForPayment } from "./ticket.service.ts";

/**
 * Payment gateway service. The `payments` table is the single source of truth.
 *
 * A webhook is only a *hint* that something changed: anyone can POST to it, so
 * its own "status" field is never believed. The transaction is re-checked with
 * the gateway's status API, and only a state the gateway itself reports moves a
 * payment to `completed` (which in turn confirms the buyer's order).
 */

const GATEWAY_STATUS_URL =
  process.env.PAYMENT_STATUS_URL ?? "https://payment-gateway.phajay.co/v1/api/payment/status";

const PAID = new Set(["PAYMENT_COMPLETED", "COMPLETED", "PAID", "SUCCESS", "TRUE", "1"]);
const FAILED = new Set(["FAILED", "CANCELLED", "CANCELED", "EXPIRED", "REJECTED"]);

type PaymentState = "pending" | "completed" | "failed";

const classify = (raw: unknown): PaymentState => {
  const s = String(raw ?? "").toUpperCase();
  return raw === true || PAID.has(s) ? "completed" : FAILED.has(s) ? "failed" : "pending";
};

class PaymentService {
  private extractTxId(payload: any): string {
    return String(
      payload.transactionId ||
        payload.data?.transactionId ||
        payload.id ||
        payload.orderId ||
        payload.ref ||
        "",
    ).trim();
  }

  /** Ask the gateway what it says about a transaction. `null` = could not reach / no answer. */
  private async askGateway(txId: string): Promise<{ state: PaymentState; raw: string } | null> {
    try {
      const res = await fetch(`${GATEWAY_STATUS_URL}/${encodeURIComponent(txId)}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      const data: any = await res.json();
      const raw = data?.status ?? data?.data?.status;
      return raw == null ? null : { state: classify(raw), raw: String(raw) };
    } catch (error: any) {
      logger.warn("[payment] gateway status check failed:", error?.message);
      return null;
    }
  }

  private async save(txId: string, state: PaymentState, raw: string | null, payload?: unknown) {
    const verifiedAt = state === "completed" ? new Date() : null;
    await db
      .insert(payments)
      .values({ transactionId: txId, state, rawStatus: raw, payload: payload ?? null, verifiedAt })
      .onConflictDoUpdate({
        target: payments.transactionId,
        set: {
          state,
          rawStatus: raw,
          ...(payload !== undefined && { payload }),
          verifiedAt,
          updatedAt: new Date(),
        },
      });
    if (state === "completed") await confirmOrderForPayment(txId);
  }

  /** Handle a gateway webhook: record it, then trust only the gateway's own answer. */
  async recordWebhook(payload: any): Promise<{ txId: string | null; isPaid: boolean; status: string }> {
    const txId = this.extractTxId(payload);
    if (!txId) return { txId: null, isPaid: false, status: "" };

    const claimed = payload.status ?? payload.data?.status ?? payload.paymentStatus ?? payload.state ?? null;
    const verified = await this.askGateway(txId);
    const state = verified?.state ?? "pending";

    await this.save(txId, state, verified?.raw ?? (claimed == null ? null : String(claimed)), payload);
    logger.info(`[payment] webhook ${txId} -> ${state}${verified ? "" : " (gateway unreachable)"}`);
    return { txId, isPaid: state === "completed", status: verified?.raw ?? String(claimed ?? "") };
  }

  /** Current status of a transaction; asks the gateway again while it isn't settled. */
  async getPaymentStatus(
    transactionId: string,
  ): Promise<{ status: string; verified: boolean; updatedAt?: string }> {
    if (!transactionId) return { status: "UNKNOWN", verified: false };

    const known = await db.query.payments.findFirst({
      where: eq(payments.transactionId, transactionId),
    });
    if (known?.state === "completed") {
      return { status: "COMPLETED", verified: true, updatedAt: known.updatedAt.toISOString() };
    }

    const verified = await this.askGateway(transactionId);
    if (verified) {
      await this.save(transactionId, verified.state, verified.raw);
      return { status: verified.state.toUpperCase(), verified: verified.state === "completed" };
    }
    return { status: (known?.state ?? "pending").toUpperCase(), verified: false };
  }
}

export const paymentService = new PaymentService();
