import { eq } from "drizzle-orm";
import { db } from "../config/database.ts";
import { payments } from "../models/schema.ts";
import { logger } from "../utils/logger.ts";

/**
 * Pasopkan Payment Gateway Service.
 * Webhook state is persisted to the `payments` table (so it survives a
 * restart) with an in-memory cache in front for fast reads and a fallback
 * when the DB is unavailable.
 */

const PAID_STATES = new Set(["PAYMENT_COMPLETED", "COMPLETED", "PAID", "SUCCESS", "true", "1"]);

interface CachedPayment {
  state: "pending" | "completed" | "failed";
  rawStatus: string | null;
  updatedAt: string;
}

class PaymentService {
  private cache = new Map<string, CachedPayment>();

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

  private isPaid(rawStatus: unknown): boolean {
    return rawStatus === true || PAID_STATES.has(String(rawStatus));
  }

  /** Record or update an incoming webhook notification. */
  async recordWebhook(
    payload: any,
  ): Promise<{ txId: string | null; isPaid: boolean; status: string }> {
    const txId = this.extractTxId(payload);
    const rawStatus =
      payload.status ?? payload.data?.status ?? payload.paymentStatus ?? payload.state ?? null;
    const paid = this.isPaid(rawStatus);
    const state: CachedPayment["state"] = paid ? "completed" : "pending";

    if (txId) {
      this.cache.set(txId, {
        state,
        rawStatus: rawStatus == null ? null : String(rawStatus),
        updatedAt: new Date().toISOString(),
      });
      try {
        await db
          .insert(payments)
          .values({
            transactionId: txId,
            state,
            rawStatus: rawStatus == null ? null : String(rawStatus),
            payload,
            verifiedAt: paid ? new Date() : null,
          })
          .onConflictDoUpdate({
            target: payments.transactionId,
            set: {
              state,
              rawStatus: rawStatus == null ? null : String(rawStatus),
              payload,
              verifiedAt: paid ? new Date() : null,
              updatedAt: new Date(),
            },
          });
      } catch (error: any) {
        logger.warn("[payment.service] webhook persist fallback (cache only):", error?.message);
      }
      logger.info(`[payment.service] webhook stored: ${txId} -> ${state}`);
    }

    return { txId: txId || null, isPaid: paid, status: String(rawStatus ?? "") };
  }

  /** Retrieve or verify the status of a transaction. */
  async getPaymentStatus(
    transactionId: string,
  ): Promise<{ status: string; verified: boolean; updatedAt?: string }> {
    if (!transactionId) return { status: "UNKNOWN", verified: false };

    const known = await this.lookup(transactionId);
    if (known?.state === "completed") {
      return { status: "COMPLETED", verified: true, updatedAt: known.updatedAt };
    }

    // Not confirmed yet — poll the upstream gateway
    try {
      const response = await fetch(
        `https://payment-gateway.phajay.co/v1/api/payment/status/${encodeURIComponent(transactionId)}`,
        { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(3500) },
      );
      if (response.ok) {
        const data: any = await response.json();
        const gwStatus = data?.status ?? data?.data?.status;
        if (this.isPaid(gwStatus)) {
          await this.recordWebhook({ transactionId, status: gwStatus, ...data });
          return { status: "COMPLETED", verified: true, updatedAt: new Date().toISOString() };
        }
      }
    } catch {
      // upstream poll failed / timed out — return whatever we last knew
    }

    return { status: (known?.state ?? "pending").toUpperCase(), verified: false };
  }

  private async lookup(txId: string): Promise<CachedPayment | undefined> {
    const cached = this.cache.get(txId);
    if (cached) return cached;
    try {
      const row = await db.query.payments.findFirst({ where: eq(payments.transactionId, txId) });
      if (row) {
        const entry: CachedPayment = {
          state: row.state,
          rawStatus: row.rawStatus,
          updatedAt: (row.updatedAt ?? new Date()).toISOString(),
        };
        this.cache.set(txId, entry);
        return entry;
      }
    } catch (error: any) {
      logger.warn("[payment.service] lookup DB fallback:", error?.message);
    }
    return undefined;
  }
}

export const paymentService = new PaymentService();
