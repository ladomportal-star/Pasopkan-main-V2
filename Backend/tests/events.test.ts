import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.ts";

const app = createApp();
const auth = { Authorization: "Bearer organizer-uid" };

const sampleEvent = {
  title: "Vientiane Marathon 2026",
  category: "Sports",
  dateType: "fixed",
  startDate: "2026-12-01",
  startTime: "05:00",
  venueName: "That Luang Square",
  province: "Vientiane",
  organizer: { name: "Lao Runners Club", contactEmail: "club@example.com" },
  tiers: [
    { name: "10K", priceKip: 150000, quantityTotal: 500 },
    { name: "Half", priceKip: 250000 },
  ],
  zones: [{ name: "Start Pen A", priceKip: 0, capacity: 200 }],
  coupons: [{ code: "EARLYBIRD", discountType: "percent", discountValue: 10 }],
};

describe("POST /api/events", () => {
  it("401s without auth", async () => {
    const res = await request(app).post("/api/events").send(sampleEvent);
    expect(res.status).toBe(401);
  });

  it("400s when title is missing", async () => {
    const res = await request(app).post("/api/events").set(auth).send({ category: "Sports" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  it("creates an event with nested tiers/zones/coupons (in-memory fallback)", async () => {
    const res = await request(app).post("/api/events").set(auth).send(sampleEvent);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.event.title).toBe("Vientiane Marathon 2026");
    expect(res.body.event.tiers).toHaveLength(2);
    expect(res.body.event.zones).toHaveLength(1);
    expect(res.body.event.coupons[0].code).toBe("EARLYBIRD");
  });
});

describe("GET /api/events", () => {
  it("lists events", async () => {
    await request(app).post("/api/events").set(auth).send(sampleEvent);
    const res = await request(app).get("/api/events");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body.events.length).toBeGreaterThan(0);
  });
});

describe("PUT /api/events/:id", () => {
  it("only touches child arrays that were sent", async () => {
    const created = await request(app).post("/api/events").set(auth).send(sampleEvent);
    const id = created.body.event.id;

    // send just `status` — tiers/zones/coupons must be left alone
    const res = await request(app).put(`/api/events/${id}`).set(auth).send({ status: "published" });
    expect(res.status).toBe(200);
    expect(res.body.event.tiers).toHaveLength(2);
    expect(res.body.event.zones).toHaveLength(1);
    expect(res.body.event.coupons).toHaveLength(1);
  });
});
