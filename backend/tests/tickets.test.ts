import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.ts";

const app = createApp();
const auth = { Authorization: "Bearer test-user-uid" };

describe("POST /api/tickets", () => {
  it("401s without a bearer token", async () => {
    const res = await request(app).post("/api/tickets").send({});
    expect(res.status).toBe(401);
  });

  it("400s on an invalid body", async () => {
    const res = await request(app).post("/api/tickets").set(auth).send({ eventId: "1" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
    expect(res.body.details).toHaveProperty("quantity");
  });

  it("creates an order with one item per quantity (in-memory fallback)", async () => {
    const res = await request(app).post("/api/tickets").set(auth).send({
      eventId: "1",
      eventTitle: "That Luang Festival",
      tierId: "vip",
      tierName: "VIP",
      price: 250000,
      quantity: 3,
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.items).toHaveLength(3);
    expect(res.body.order.totalKip).toBe(750000);
    expect(res.body.items[0].ticketCode).toMatch(/^PSK-/);
  });

  it("lists the caller's orders", async () => {
    const res = await request(app).get("/api/tickets").set(auth);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tickets)).toBe(true);
    expect(res.body.tickets.length).toBeGreaterThan(0);
  });
});
