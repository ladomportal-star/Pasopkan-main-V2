import { db } from "../config/database.ts";
import { HttpError } from "../middlewares/error.middleware.ts";
import type { IncomingHttpHeaders } from "node:http";
import { env } from "../config/env.ts";
import type { PaymentProvider } from "./payment-provider.ts";

// Live gateway operations are deliberately disabled until vendor documentation,
// credentials, webhook authentication and amount/order verification are implemented.
class PaymentService {
  private provider: PaymentProvider | null = null;

  /** Called by a provider-specific adapter during application startup. */
  registerProvider(provider: PaymentProvider) {
    if (!env.payment.credentialsComplete || env.payment.provider !== provider.id) {
      throw new Error("Payment provider does not match complete server configuration");
    }
    this.provider = provider;
  }

  getReadiness() {
    return {
      configured: env.payment.credentialsComplete,
      adapterRegistered: this.provider !== null,
      provider: this.provider?.id ?? null,
      checkoutEnabled: false,
      refundsEnabled: false,
    };
  }

  async recordWebhook(
    _rawBody: Buffer,
    _headers: IncomingHttpHeaders,
  ): Promise<{ txId: string | null; isPaid: boolean; status: string }> {
    // Fail closed until a provider adapter implements signature verification,
    // checkout persistence, and atomic settlement against the order amount.
    if (!this.getReadiness().checkoutEnabled) {
      throw new HttpError(503, "Payment provider integration is not configured");
    }
    throw new HttpError(503, "Payment webhook settlement is not enabled for this provider");
  }
  async getPaymentStatus(transactionId: string, uid?: string) {
    if (!uid) throw new HttpError(401, "Sign in to view payment status");
    if (!env.payment.provider)
      throw new HttpError(503, "Payment provider integration is not configured");
    const payment = await db.payment.findFirst({
      where: {
        provider: env.payment.provider,
        providerTransactionId: transactionId,
        order: { user: { authId: uid } },
      },
    });
    if (!payment) throw new HttpError(404, "Payment not found");
    return {
      status: payment.state.toUpperCase(),
      verified: payment.state === "completed" && payment.verifiedAt !== null,
    };
  }
}
export const paymentService = new PaymentService();
