import type { IncomingHttpHeaders } from "node:http";

/** Provider-neutral, verified webhook data. Implementations MUST verify the
 * exact raw request bytes and reject invalid signatures before returning. */
export interface VerifiedPaymentWebhook {
  eventId: string;
  transactionId: string;
  merchantReference: string;
  amountKip: number;
  currency: string;
  outcome: "paid" | "failed" | "pending" | "refunded";
}

export interface PaymentProvider {
  readonly id: string;
  verifyWebhook(input: {
    rawBody: Buffer;
    headers: IncomingHttpHeaders;
    webhookSecret: string;
  }): Promise<VerifiedPaymentWebhook>;
  createCheckout(input: {
    merchantReference: string;
    amountKip: number;
    currency: string;
    idempotencyKey: string;
    returnUrl: string;
  }): Promise<{ transactionId: string; checkoutUrl: string }>;
  refund(input: {
    transactionId: string;
    amountKip: number;
    currency: string;
    idempotencyKey: string;
  }): Promise<{ refundId: string; status: "succeeded" | "processing" }>;
}
