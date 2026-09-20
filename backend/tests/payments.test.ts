import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.ts";
import { as } from "./helpers/auth.ts";
import { createEvent } from "./helpers/seed.ts";

const app = createApp();
const realFetch = globalThis.fetch;

/** Make the payment gateway answer with `status` (or be unreachable when null). */
const gatewaySays = (status: string | null) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).includes("/payment/status/")) {
        if (status === null) throw new Error("gateway down");
        return new Response(JSON.stringify({ status }), { status: 200 });
      }
      return realFetch(input, init);
    }),
  );

afterEach(() => vi.unstubAllGlobals());

async function pendingOrder(buyer: string, txn: string) {
  const event = await createEvent(app, await as("pay-host"), { title: "Paid Show" });
  const res = await request(app)
    .post("/api/tickets")
    .set(await as(buyer))
    .send({ eventId: event.id, tierId: "General", quantity: 1, paymentTxnId: txn });
  expect(res.body.order.status).toBe("pending");
  return res.body.order.id as string;
}

const myOrders = async (buyer: string) =>
  (await request(app).get("/api/tickets").set(await as(buyer))).body.tickets as { id: string; status: string }[];

describe("payments", () => {
  it("does not believe a webhook that merely claims the payment succeeded", async () => {
    await pendingOrder("payer-1", "TXN-FORGED");
    gatewaySays("PENDING"); // the gateway disagrees with the forged payload

    const res = await request(app).post("/api/webhook/payment").send({ transactionId: "TXN-FORGED", status: "PAID" });
    expect(res.status).toBe(200);
    expect(res.body.paid).toBe(false);
    expect((await myOrders("payer-1"))[0].status).toBe("pending");
  });

  it("confirms the order and notifies the buyer once the gateway itself reports paid", async () => {
    await pendingOrder("payer-2", "TXN-REAL");
    gatewaySays("PAYMENT_COMPLETED");

    const res = await request(app).post("/api/webhook/payment").send({ transactionId: "TXN-REAL", status: "whatever" });
    expect(res.body.paid).toBe(true);
    expect((await myOrders("payer-2"))[0].status).toBe("confirmed");

    const inbox = await request(app).get("/api/notifications").set(await as("payer-2"));
    expect(inbox.body.notifications.map((n: { title: string }) => n.title)).toContain("Ticket confirmed");
  });

  it("stays pending (never optimistic) when the gateway cannot be reached", async () => {
    await pendingOrder("payer-3", "TXN-OFFLINE");
    gatewaySays(null);

    const res = await request(app).post("/api/webhook/payment").send({ transactionId: "TXN-OFFLINE", status: "PAID" });
    expect(res.body.paid).toBe(false);
    expect((await myOrders("payer-3"))[0].status).toBe("pending");
  });

  it("status endpoint re-checks the gateway and settles the order", async () => {
    await pendingOrder("payer-4", "TXN-POLL");
    gatewaySays("SUCCESS");

    const res = await request(app).get("/api/payment/status/TXN-POLL");
    expect(res.body).toMatchObject({ status: "COMPLETED", verified: true });
    expect((await myOrders("payer-4"))[0].status).toBe("confirmed");
  });

  it("an order placed after a verified payment is confirmed immediately", async () => {
    gatewaySays("PAID");
    await request(app).get("/api/payment/status/TXN-EARLY"); // gateway-verified, no order yet
    const event = await createEvent(app, await as("pay-host"));
    const res = await request(app)
      .post("/api/tickets")
      .set(await as("payer-5"))
      .send({ eventId: event.id, tierId: "General", quantity: 1, paymentTxnId: "TXN-EARLY" });
    expect(res.body.order.status).toBe("confirmed");
  });
});
