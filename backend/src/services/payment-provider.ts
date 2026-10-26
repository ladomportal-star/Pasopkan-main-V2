import type { IncomingHttpHeaders } from "node:http";

export type PaymentCheckoutMethod =
  "bcel" | "ldb" | "jdb" | "ib" | "stb" | "m-money" | "credit_card" | "payment_link";

/** Provider-neutral, verified webhook data. Implementations MUST verify the
 * exact raw request bytes and reject invalid signatures before returning. */
export interface VerifiedPaymentWebhook {
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
    paymentMethod?: PaymentCheckoutMethod;
  }): Promise<{
    transactionId: string | null;
    checkoutUrl: string | null;
    qrCode?: string | null;
  }>;
  checkTransaction(transactionId: string): Promise<{
    outcome: "paid" | "failed" | "pending" | "refunded";
    transactionId: string;
    amountKip?: number;
    currency?: string;
  }>;
  refund(input: {
    transactionId: string;
    amountKip: number;
    currency: string;
    idempotencyKey: string;
  }): Promise<{ refundId: string; status: "succeeded" | "processing" | "failed" }>;
  checkRefund(refundId: string): Promise<{ status: "succeeded" | "processing" | "failed" }>;
}
