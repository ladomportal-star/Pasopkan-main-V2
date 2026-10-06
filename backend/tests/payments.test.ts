import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.ts";
import { as } from "./helpers/auth.ts";
import { createEvent } from "./helpers/seed.ts";
const app = createApp();
describe("unconfigured payment provider fails closed", () => {
  it("does not accept unverified webhooks", async () => {
    const res = await request(app).post("/api/webhook/payment").send({ transactionId:"FORGED",status:"PAID" });
    expect(res.status).toBe(503);
  });
  it("requires authentication to read payment status", async () => {
    expect((await request(app).get("/api/payment/status/TXN")).status).toBe(401);
    expect((await request(app).get("/api/payment/status/TXN").set(await as("stranger"))).status).toBe(404);
  });
  it("rejects client-provided transaction IDs during checkout", async () => {
    const event = await createEvent(app,await as("host"));
    const res = await request(app).post("/api/tickets").set(await as("buyer")).send({eventId:event.id,tierId:event.tiers[0].id,quantity:1,paymentTxnId:"STOLEN"});
    expect(res.status).toBe(400);
  });
});
