import { createHmac, timingSafeEqual } from "node:crypto";
import { HttpError } from "../middlewares/error.middleware.ts";
import type { PaymentProvider, VerifiedPaymentWebhook } from "./payment-provider.ts";

type Json = Record<string, unknown>;

const asObject = (value: unknown): Json =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Json) : {};
const asString = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const asNumber = (value: unknown) => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : NaN;
};

function mapPaymentStatus(value: unknown): "paid" | "failed" | "pending" | "refunded" {
  const status = asString(value).toUpperCase();
  if (["PAYMENT_COMPLETED", "COMPLETED", "SUCCESS", "SUCCESSFULLY", "PAID"].includes(status))
    return "paid";
  if (["REFUNDED", "REFUND_COMPLETED", "REFUND_SUCCESS"].includes(status)) return "refunded";
  if (["FAILED", "PAYMENT_FAILED", "CANCEL", "CANCELLED", "CANCELED"].includes(status))
    return "failed";
  return "pending";
}

function mapRefundStatus(value: unknown): "succeeded" | "processing" | "failed" {
  const status = asString(value).toUpperCase();
  if (["SUCCESS", "SUCCESSFULLY", "SUCCEEDED", "COMPLETED", "REFUNDED"].includes(status))
    return "succeeded";
  if (["FAILED", "REJECTED", "CANCEL", "CANCELLED", "CANCELED"].includes(status)) return "failed";
  return "processing";
}

export class PhajayProvider implements PaymentProvider {
  readonly id = "phajay";

  constructor(
    private readonly config: {
      baseUrl: string;
      apiKey: string;
      webhookSecret: string;
      environment: "sandbox" | "production";
    },
  ) {}

  private async request(path: string, init: RequestInit, auth: "basic" | "secretKey") {
    const response = await fetch(new URL(path, this.config.baseUrl), {
      ...init,
      signal: AbortSignal.timeout(15_000),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(auth === "basic"
          ? { Authorization: `Basic ${Buffer.from(this.config.apiKey).toString("base64")}` }
          : { secretKey: this.config.apiKey }),
        ...init.headers,
      },
    });
    const payload = asObject(await response.json().catch(() => ({})));
    if (!response.ok) {
      const message =
        asString(payload.message) || asString(payload.error) || "PhaJay request failed";
      throw new HttpError(502, message);
    }
    return payload;
  }

  async createCheckout(input: {
    merchantReference: string;
    amountKip: number;
    currency: string;
    idempotencyKey: string;
    returnUrl: string;
  }) {
    if (input.currency !== "LAK") throw new HttpError(422, "PhaJay Payment Link requires LAK");
    const path =
      this.config.environment === "sandbox"
        ? "/v1/api/test/payment/get-payment-link"
        : "/v1/api/link/payment-link";
    const data = await this.request(
      path,
      {
        method: "POST",
        body: JSON.stringify({
          orderNo: input.merchantReference,
          amount: input.amountKip,
          description: `Pasopkan order ${input.merchantReference}`,
          tag1: input.merchantReference,
          tag2: input.idempotencyKey,
        }),
      },
      "basic",
    );
    const checkoutUrl = asString(data.redirectURL);
    if (!checkoutUrl) throw new HttpError(502, "PhaJay did not return a payment link");
    return {
      // Payment Link creation returns linkCode rather than the settled
      // transactionId. Persist the actual transactionId only after the signed
      // callback so a provider that uses different values is not rejected.
      transactionId: asString(data.transactionId) || null,
      checkoutUrl,
    };
  }

  async verifyWebhook(input: {
    rawBody: Buffer;
    headers: import("node:http").IncomingHttpHeaders;
    webhookSecret: string;
  }): Promise<VerifiedPaymentWebhook> {
    const header = input.headers["x-signature"];
    const supplied = Array.isArray(header) ? header[0] : header;
    if (!supplied) throw new HttpError(401, "Missing PhaJay webhook signature");
    const expected = createHmac("sha256", input.webhookSecret)
      .update(input.rawBody)
      .digest("base64");
    const left = Buffer.from(supplied);
    const right = Buffer.from(expected);
    if (left.length !== right.length || !timingSafeEqual(left, right))
      throw new HttpError(401, "Invalid PhaJay webhook signature");

    let payload: Json;
    try {
      payload = asObject(JSON.parse(input.rawBody.toString("utf8")));
    } catch {
      throw new HttpError(400, "Invalid PhaJay webhook JSON");
    }
    const transactionId = asString(payload.transactionId) || asString(payload.linkCode);
    const merchantReference = asString(payload.orderNo) || asString(payload.tag1);
    const amountKip = asNumber(payload.txnAmount ?? payload.amount);
    const currency = (asString(payload.sourceCurrency ?? payload.currency) || "LAK").toUpperCase();
    if (!transactionId || !merchantReference || !Number.isSafeInteger(amountKip) || amountKip <= 0)
      throw new HttpError(400, "Incomplete PhaJay webhook payload");
    return {
      transactionId,
      merchantReference,
      amountKip,
      currency,
      outcome: mapPaymentStatus(payload.status),
    };
  }

  async checkTransaction(transactionId: string) {
    const data = await this.request(
      `/v1/api/payment/check-transaction/status/${encodeURIComponent(transactionId)}`,
      { method: "GET" },
      "basic",
    );
    const row = asObject(data.data);
    const source = Object.keys(row).length ? row : data;
    return {
      transactionId: asString(source.transactionId) || transactionId,
      outcome: mapPaymentStatus(source.status ?? (source.isPaid === true ? "PAID" : "PENDING")),
      amountKip: Number.isSafeInteger(asNumber(source.txnAmount ?? source.amount))
        ? asNumber(source.txnAmount ?? source.amount)
        : undefined,
      currency: asString(source.sourceCurrency ?? source.currency).toUpperCase() || undefined,
    };
  }

  async refund(input: {
    transactionId: string;
    amountKip: number;
    currency: string;
    idempotencyKey: string;
  }) {
    const data = await this.request(
      "/v1/api/refund",
      { method: "POST", body: JSON.stringify({ transactionId: input.transactionId }) },
      "secretKey",
    );
    const row = asObject(data.data);
    const refundId = asString(row.id) || asString(data.id);
    if (!refundId) throw new HttpError(502, "PhaJay did not return a refund bill ID");
    return { refundId, status: mapRefundStatus(row.status ?? data.status) };
  }

  async checkRefund(refundId: string) {
    const data = await this.request(
      `/v1/api/refund/${encodeURIComponent(refundId)}`,
      { method: "GET" },
      "secretKey",
    );
    const row = asObject(data.data);
    return { status: mapRefundStatus(row.status ?? data.status) };
  }
}
