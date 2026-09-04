import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.ts";

const app = createApp();
const staff = { Authorization: "Bearer staff-uid" };

describe("POST /api/checkins", () => {
  it("401s without auth", async () => {
    const res = await request(app).post("/api/checkins").send({ ticketCode: "X", eventId: "1" });
    expect(res.status).toBe(401);
  });

  it("400s without a ticket code", async () => {
    const res = await request(app).post("/api/checkins").set(staff).send({ eventId: "1" });
    expect(res.status).toBe(400);
  });

  it("records a scan, then reports already_checked_in on re-scan", async () => {
    const code = `PSK-TEST-${Date.now()}`;
    const first = await request(app)
      .post("/api/checkins")
      .set(staff)
      .send({ ticketCode: code, eventId: "evt-1", attendeeName: "Somchai", gate: "Main" });
    expect(first.status).toBe(201);
    expect(first.body.status).toBe("checked_in");

    const second = await request(app)
      .post("/api/checkins")
      .set(staff)
      .send({ ticketCode: code, eventId: "evt-1" });
    expect(second.status).toBe(200);
    expect(second.body.status).toBe("already_checked_in");
  });

  it("lists check-ins for an event", async () => {
    const code = `PSK-LIST-${Date.now()}`;
    await request(app)
      .post("/api/checkins")
      .set(staff)
      .send({ ticketCode: code, eventId: "evt-list" });
    const res = await request(app).get("/api/checkins?eventId=evt-list").set(staff);
    expect(res.status).toBe(200);
    expect(res.body.checkIns.some((c: any) => c.ticketCode === code)).toBe(true);
  });
});
