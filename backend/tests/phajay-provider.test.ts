import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PhajayProvider } from "../src/services/phajay-provider.ts";

const provider = (environment: "sandbox" | "production" = "sandbox") =>
  new PhajayProvider({
    baseUrl: "https://payment-gateway.phajay.co",
    apiKey: "test-secret",
    webhookSecret: "test-secret",
    environment,
  });

afterEach(() => vi.unstubAllGlobals());

describe("PhaJay provider", () => {
  it("creates a sandbox Payment Link with Basic Auth", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: "SUCCESS",
          redirectURL: "https://payment-link-sandbox.netlify.app?linkCode=LINK-1",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await provider().createCheckout({
      merchantReference: "PSK123",
      amountKip: 50_000,
      currency: "LAK",
      idempotencyKey: "idem-1",
      returnUrl: "",
    });

    expect(result).toEqual({
      transactionId: null,
      checkoutUrl: "https://payment-link-sandbox.netlify.app?linkCode=LINK-1",
    });
    const [url, request] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.pathname).toBe("/v1/api/test/payment/get-payment-link");
    expect(request.headers).toMatchObject({
      Authorization: `Basic ${Buffer.from("test-secret").toString("base64")}`,
    });
    expect(JSON.parse(String(request.body))).toMatchObject({
      orderNo: "PSK123",
      amount: 50_000,
      tag1: "PSK123",
      tag2: "idem-1",
    });
  });

  it("creates a bank QR code with secretKey header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: "SUCCESS",
          transactionId: "txn-qr-1",
          qrCode: "000201010212...",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await provider("production").createCheckout({
      merchantReference: "PSK456",
      amountKip: 120_000,
      currency: "LAK",
      idempotencyKey: "idem-qr-1",
      returnUrl: "",
      paymentMethod: "bcel",
    });

    expect(result).toEqual({
      transactionId: "txn-qr-1",
      checkoutUrl: null,
      qrCode: "000201010212...",
    });
    const [url, request] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.pathname).toBe("/v1/api/payment/generate-bcel-qr");
    expect(request.headers).toMatchObject({
      secretKey: "test-secret",
    });
  });

  it("creates a credit card payment link with Basic Auth", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: "SUCCESS",
          transactionId: "txn-cc-1",
          paymentUrl: "https://payment-gateway.phajay.co/cc/txn-cc-1",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await provider("production").createCheckout({
      merchantReference: "PSK789",
      amountKip: 250_000,
      currency: "LAK",
      idempotencyKey: "idem-cc-1",
      returnUrl: "",
      paymentMethod: "credit_card",
    });

    expect(result).toEqual({
      transactionId: "txn-cc-1",
      checkoutUrl: "https://payment-gateway.phajay.co/cc/txn-cc-1",
    });
    const [url, request] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.pathname).toBe("/v1/api/jdb2c2p/payment/payment-link");
    expect(request.headers).toMatchObject({
      Authorization: `Basic ${Buffer.from("test-secret").toString("base64")}`,
    });
  });

  it("verifies the exact raw webhook bytes", async () => {
    const rawBody = Buffer.from(
      JSON.stringify({
        orderNo: "PSK123",
        transactionId: "txn-1",
        txnAmount: 50_000,
        sourceCurrency: "LAK",
        status: "PAYMENT_COMPLETED",
      }),
    );
    const signature = createHmac("sha256", "test-secret").update(rawBody).digest("base64");

    await expect(
      provider().verifyWebhook({
        rawBody,
        headers: { "x-signature": signature },
        webhookSecret: "test-secret",
      }),
    ).resolves.toEqual({
      transactionId: "txn-1",
      merchantReference: "PSK123",
      amountKip: 50_000,
      currency: "LAK",
      outcome: "paid",
    });
  });

  it("rejects an invalid webhook signature", async () => {
    await expect(
      provider().verifyWebhook({
        rawBody: Buffer.from('{"status":"PAYMENT_COMPLETED"}'),
        headers: { "x-signature": "invalid" },
        webhookSecret: "test-secret",
      }),
    ).rejects.toMatchObject({ status: 401 });
  });

  it("submits and checks a refund with the secretKey header", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { id: "refund-1", status: "REQUESTING" } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { id: "refund-1", status: "COMPLETED" } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      provider("production").refund({
        transactionId: "txn-1",
        amountKip: 50_000,
        currency: "LAK",
        idempotencyKey: "refund-idem",
      }),
    ).resolves.toEqual({ refundId: "refund-1", status: "processing" });
    await expect(provider("production").checkRefund("refund-1")).resolves.toEqual({
      status: "succeeded",
    });

    const [, request] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(request.headers).toMatchObject({ secretKey: "test-secret" });
    expect(JSON.parse(String(request.body))).toEqual({ transactionId: "txn-1" });
  });
});
