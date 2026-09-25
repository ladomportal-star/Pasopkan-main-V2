import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.ts";
import { as } from "./helpers/auth.ts";
import { createEvent } from "./helpers/seed.ts";

const app = createApp();

async function ticketCode(tier: "Free" | "General") {
  const event = await createEvent(app, await as("gate-host"));
  const res = await request(app)
    .post("/api/tickets")
    .set(await as("attendee"))
    .send({ eventId: event.id, tierId: tier, quantity: 1 });
  return { event, code: res.body.items[0].ticketCode as string };
}

const scan = async (body: Record<string, unknown>) =>
  request(app)
    .post("/api/checkins")
    .set(await as("staff-1"))
    .send(body);

describe("check-ins", () => {
  it("requires sign-in and a valid body", async () => {
    expect((await request(app).post("/api/checkins").send({})).status).toBe(401);
    expect((await scan({})).status).toBe(400);
    expect((await request(app).get("/api/checkins")).status).toBe(401);
  });

  it("checks a paid-for ticket in once; scanning it again is idempotent", async () => {
    const { event, code } = await ticketCode("Free");
    const first = await scan({ ticketCode: code, eventId: event.id });
    expect(first.status).toBe(201);
    expect(first.body.status).toBe("checked_in");
    expect(first.body.checkIn.checkedInBy).toBe("staff-1@test.local");

    const again = await scan({ ticketCode: code, eventId: event.id });
    expect(again.status).toBe(200);
    expect(again.body.status).toBe("already_checked_in");

    const list = await request(app)
      .get(`/api/checkins?eventId=${event.id}`)
      .set(await as("staff-1"));
    expect(list.body.checkIns).toHaveLength(1);
  });

  it("refuses a ticket whose order has not been paid", async () => {
    const { event, code } = await ticketCode("General"); // paid tier, still pending
    const res = await scan({ ticketCode: code, eventId: event.id });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/not been paid/);
  });

  it("404s a ticket code that doesn't match any real order (no scan-anything backdoor)", async () => {
    const { event } = await ticketCode("Free");
    const res = await scan({ ticketCode: "NOT-A-REAL-CODE", eventId: event.id });
    expect(res.status).toBe(404);
  });

  it("lookup previews a real ticket without checking it in, then reflects the check-in", async () => {
    const { event, code } = await ticketCode("Free");

    const miss = await request(app)
      .get("/api/checkins/lookup/NOT-A-REAL-CODE")
      .set(await as("staff-1"));
    expect(miss.status).toBe(404);

    const before = await request(app).get(`/api/checkins/lookup/${code}`).set(await as("staff-1"));
    expect(before.status).toBe(200);
    expect(before.body.ticket.ticketCode).toBe(code);
    expect(before.body.ticket.alreadyCheckedIn).toBe(false);

    await scan({ ticketCode: code, eventId: event.id });

    const after = await request(app).get(`/api/checkins/lookup/${code}`).set(await as("staff-1"));
    expect(after.body.ticket.alreadyCheckedIn).toBe(true);
  });
});
