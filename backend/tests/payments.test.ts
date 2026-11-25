import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.ts";
import { db } from "../src/config/database.ts";
import { env } from "../src/config/env.ts";
import { paymentService } from "../src/services/payment.service.ts";
import type { PaymentProvider } from "../src/services/payment-provider.ts";
import { releaseExpiredOrders } from "../src/services/ticket.service.ts";
import { as } from "./helpers/auth.ts";
import { createEvent } from "./helpers/seed.ts";
const app = createApp();

/** A stand-in provider: the webhook body is trusted as already verified, and the status
 *  poll answers whatever `pollResult` holds. Signature checks are covered in phajay-provider tests. */
let pollResult: Awaited<ReturnType<PaymentProvider["checkTransaction"]>> | null = null;
const fakeProvider: PaymentProvider = {
  id: "phajay",
  verifyWebhook: async ({ rawBody }) => JSON.parse(rawBody.toString("utf8")),
  createCheckout: async () => ({ transactionId: null, checkoutUrl: null }),
  checkTransaction: async (transactionId) => pollResult ?? { outcome: "pending", transactionId },
  refund: async () => ({ refundId: "R1", status: "processing" }),
  checkRefund: async () => ({ status: "processing" }),
};
const providerSlot = paymentService as unknown as { provider: PaymentProvider | null };
const paymentEnv = env.payment as { provider: string };

async function pendingOrder(buyer: string) {
  const event = await createEvent(app, await as(`${buyer}-host`), {
    tiers: [{ name: "General", priceKip: 100000, quantityTotal: 5 }],
  });
  const res = await request(app)
    .post("/api/tickets")
    .set(await as(buyer))
    .send({ eventId: event.id, tierId: event.tiers[0].id, quantity: 2 });
  expect(res.status).toBe(200);
  expect(res.body.order.status).toBe("pending");
  return { order: res.body.order as { id: string; orderNumber: string }, tierId: event.tiers[0].id };
}
const webhook = (orderNumber: string, transactionId: string, status: string, amountKip = 200000) =>
  paymentService.recordWebhook(
    Buffer.from(
      JSON.stringify({
        transactionId,
        merchantReference: orderNumber,
        amountKip,
        currency: "LAK",
        outcome: status,
      }),
    ),
    {},
  );
const expire = (orderId: string) =>
  db.$executeRaw`UPDATE "Order" SET "expiresAt" = now() - interval '1 second' WHERE id = ${orderId}::uuid`;

describe("payment settlement", () => {
  beforeEach(() => {
    providerSlot.provider = fakeProvider;
    paymentEnv.provider = "phajay";
    pollResult = null;
  });
  afterEach(() => {
    providerSlot.provider = null;
    paymentEnv.provider = "";
  });

  it("confirms a paid order inside its hold", async () => {
    const { order } = await pendingOrder("settle-ok");
    const result = await webhook(order.orderNumber, "TX-OK", "paid");
    expect(result.isPaid).toBe(true);
    const row = await db.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true } });
    expect(row.status).toBe("confirmed");
    expect(row.items.every((i) => i.status === "valid")).toBe(true);
  });

  it("refunds a payment that lands after the hold ends but before the expiry job runs", async () => {
    const { order, tierId } = await pendingOrder("settle-late");
    await expire(order.id);

    const result = await webhook(order.orderNumber, "TX-LATE", "paid");
    expect(result.isPaid).toBe(false);

    const row = await db.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true } });
    expect(row.status).toBe("cancelled");
    expect(row.items.every((i) => i.status === "void")).toBe(true);
    const payment = await db.payment.findFirstOrThrow({
      where: { orderId: order.id },
      include: { refunds: true },
    });
    expect(payment.state).toBe("completed");
    expect(payment.refunds).toHaveLength(1);
    expect(payment.refunds[0].amountKip).toBe(200000);
    // Stock is returned exactly once, even after the expiry job runs.
    await releaseExpiredOrders();
    expect((await db.ticketTier.findUniqueOrThrow({ where: { id: tierId } })).quantitySold).toBe(0);
  });

  it("queues a refund when the status poll settles an already-cancelled order", async () => {
    const { order } = await pendingOrder("settle-poll");
    await db.payment.updateMany({
      where: { orderId: order.id },
      data: { providerTransactionId: "TX-POLL" },
    });
    await expire(order.id);
    await releaseExpiredOrders();

    pollResult = { outcome: "paid", transactionId: "TX-POLL", amountKip: 200000, currency: "LAK" };
    await paymentService.getPaymentStatus("TX-POLL", "settle-poll");
    // The webhook that follows must not skip the refund because the payment is already completed.
    await webhook(order.orderNumber, "TX-POLL", "paid");

    const payment = await db.payment.findFirstOrThrow({
      where: { orderId: order.id },
      include: { refunds: true },
    });
    expect(payment.state).toBe("completed");
    expect(payment.refunds).toHaveLength(1);
  });

  it("does not let a late failed or pending webhook undo a completed payment", async () => {
    const { order } = await pendingOrder("settle-replay");
    await webhook(order.orderNumber, "TX-REPLAY", "paid");
    await webhook(order.orderNumber, "TX-REPLAY", "failed");
    await webhook(order.orderNumber, "TX-REPLAY", "pending");
    const payment = await db.payment.findFirstOrThrow({ where: { orderId: order.id } });
    expect(payment.state).toBe("completed");
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe(
      "confirmed",
    );
  });
});
describe("unconfigured payment provider fails closed", () => {
  it("does not accept unverified webhooks", async () => {
    const res = await request(app)
      .post("/api/webhook/payment")
      .send({ transactionId: "FORGED", status: "PAID" });
    expect(res.status).toBe(503);
  });
  it("requires authentication to read payment status", async () => {
    expect((await request(app).get("/api/payment/status/TXN")).status).toBe(401);
    expect(
      (
        await request(app)
          .get("/api/payment/status/TXN")
          .set(await as("stranger"))
      ).status,
    ).toBe(404);
  });
  it("rejects client-provided transaction IDs during checkout", async () => {
    const event = await createEvent(app, await as("host"));
    const res = await request(app)
      .post("/api/tickets")
      .set(await as("buyer"))
      .send({ eventId: event.id, tierId: event.tiers[0].id, quantity: 1, paymentTxnId: "STOLEN" });
    expect(res.status).toBe(400);
  });
});
