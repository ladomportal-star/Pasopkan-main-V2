import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.ts";
import { as } from "./helpers/auth.ts";
import { createEvent } from "./helpers/seed.ts";
import { db } from "../src/config/database.ts";

const app = createApp();

async function ticketCode(tier: "Free" | "General") {
  const event = await createEvent(app, await as("gate-host"));
  const res = await request(app)
    .post("/api/tickets")
    .set(await as("attendee"))
    .send({ eventId: event.id, tierId: event.tiers.find((t) => t.name === tier)!.id, quantity: 1 });
  return { event, code: res.body.items[0].ticketCode as string };
}

const scan = async (body: Record<string, unknown>) =>
  request(app)
    .post("/api/checkins")
    .set(await as("gate-host"))
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
    expect(first.body.checkIn.checkedInBy).toBe("gate-host@test.local");

    const again = await scan({ ticketCode: code, eventId: event.id });
    expect(again.status).toBe(200);
    expect(again.body.status).toBe("already_checked_in");

    const list = await request(app)
      .get(`/api/checkins?eventId=${event.id}`)
      .set(await as("gate-host"));
    expect(list.body.checkIns).toHaveLength(1);
  });

  it("refuses a ticket whose order has not been paid", async () => {
    const { event, code } = await ticketCode("General"); // paid tier, still pending
    const res = await scan({ ticketCode: code, eventId: event.id });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/not been paid/);
    const preview = await request(app)
      .get(`/api/checkins/lookup/${code}`)
      .set(await as("gate-host"));
    expect(preview.body.ticket.orderStatus).toBe("pending");
    expect(preview.body.ticket.itemStatus).toBe("pending");
  });

  it("rejects a refunded ticket even when its order was previously confirmed", async () => {
    const { event, code } = await ticketCode("Free");
    await db.orderItem.update({ where: { ticketCode: code }, data: { status: "refunded" } });
    const preview = await request(app)
      .get(`/api/checkins/lookup/${code}`)
      .set(await as("gate-host"));
    expect(preview.status).toBe(200);
    expect(preview.body.ticket.itemStatus).toBe("refunded");
    const res = await scan({ ticketCode: code, eventId: event.id });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/not valid/);
    expect(await db.checkIn.count({ where: { orderItem: { ticketCode: code } } })).toBe(0);
  });

  it("blocks an ordinary user from previewing or scanning a paid ticket", async () => {
    const { event, code } = await ticketCode("Free");
    const ordinary = await as("regular-attendee");
    await request(app)
      .post("/api/account/sync")
      .set(ordinary)
      .send({ email: "regular-attendee@test.local" });
    expect((await request(app).get(`/api/checkins/lookup/${code}`).set(ordinary)).status).toBe(403);
    expect(
      (
        await request(app)
          .post("/api/checkins")
          .set(ordinary)
          .send({ ticketCode: code, eventId: event.id })
      ).status,
    ).toBe(403);
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
      .set(await as("gate-host"));
    expect(miss.status).toBe(404);

    const before = await request(app)
      .get(`/api/checkins/lookup/${code}`)
      .set(await as("gate-host"));
    expect(before.status).toBe(200);
    expect(before.body.ticket.ticketCode).toBe(code);
    expect(before.body.ticket.alreadyCheckedIn).toBe(false);

    await scan({ ticketCode: code, eventId: event.id });

    const after = await request(app)
      .get(`/api/checkins/lookup/${code}`)
      .set(await as("gate-host"));
    expect(after.body.ticket.alreadyCheckedIn).toBe(true);
  });

  it("allows assigned staff only for their event and revokes access immediately", async () => {
    const { event, code } = await ticketCode("Free");
    const otherEvent = await createEvent(app, await as("gate-host"));
    const staffAuth = await as("assigned-gate-staff");
    const profile = await request(app)
      .post("/api/account/sync")
      .set(staffAuth)
      .send({ email: "assigned-gate-staff@test.local" });
    expect(profile.status).toBe(200);
    const staffId = profile.body.user.id as string;

    // Profile email is editable, but cannot be used to claim another person's staff invite.
    const impersonator = await request(app)
      .post("/api/account/sync")
      .set(await as("email-impersonator"))
      .send({ email: "assigned-gate-staff@test.local" });
    expect(impersonator.status).toBe(200);
    expect(impersonator.body.user.authEmail).toBe("email-impersonator@test.local");

    const before = await request(app).get("/api/checkins/events").set(staffAuth);
    expect(before.status).toBe(200);
    expect(before.body.events.some((row: { id: string }) => row.id === event.id)).toBe(false);
    expect((await request(app).get(`/api/checkins/lookup/${code}`).set(staffAuth)).status).toBe(
      403,
    );
    expect(
      (
        await request(app)
          .post(`/api/events/${event.id}/staff`)
          .set(staffAuth)
          .send({ email: "assigned-gate-staff@test.local" })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .get(`/api/events/${event.id}/staff`)
          .set(await as("other-host"))
      ).status,
    ).toBe(403);

    const assigned = await request(app)
      .post(`/api/events/${event.id}/staff`)
      .set(await as("gate-host"))
      .send({ email: "assigned-gate-staff@test.local" });
    expect(assigned.status).toBe(201);
    expect(assigned.body.staff.userId).toBe(staffId);
    expect(
      (await request(app).get("/api/checkins/events").set(staffAuth)).body.events.some(
        (row: { id: string }) => row.id === event.id,
      ),
    ).toBe(true);
    expect((await request(app).get(`/api/checkins/lookup/${code}`).set(staffAuth)).status).toBe(
      200,
    );
    expect(
      (await request(app).get(`/api/checkins?eventId=${otherEvent.id}`).set(staffAuth)).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post("/api/checkins")
          .set(staffAuth)
          .send({ ticketCode: code, eventId: otherEvent.id })
      ).status,
    ).toBe(403);

    const scanned = await request(app)
      .post("/api/checkins")
      .set(staffAuth)
      .send({ ticketCode: code, eventId: event.id });
    expect(scanned.status).toBe(201);
    expect(scanned.body.checkIn.checkedInBy).toBe("assigned-gate-staff@test.local");

    const revoked = await request(app)
      .delete(`/api/events/${event.id}/staff/${staffId}`)
      .set(await as("gate-host"));
    expect(revoked.status).toBe(200);
    expect((await request(app).get(`/api/checkins/lookup/${code}`).set(staffAuth)).status).toBe(
      403,
    );
    expect(
      (
        await request(app)
          .post("/api/checkins")
          .set(staffAuth)
          .send({ ticketCode: code, eventId: event.id })
      ).status,
    ).toBe(403);
    expect(
      await db.auditLog.count({
        where: { entityType: "EventStaff", entityId: assigned.body.staff.id },
      }),
    ).toBe(2);

    // Platform admin may restore and revoke staff on someone else's event.
    await db.user.create({
      data: { authId: "staff-admin", email: "staff-admin@test.local", role: "admin" },
    });
    const admin = await as("staff-admin");
    const restored = await request(app)
      .post(`/api/events/${event.id}/staff`)
      .set(admin)
      .send({ email: "assigned-gate-staff@test.local" });
    expect(restored.status).toBe(201);
    expect(
      (await request(app).get(`/api/events/${event.id}/staff`).set(admin)).body.staff,
    ).toHaveLength(1);
    expect((await request(app).get(`/api/checkins/lookup/${code}`).set(staffAuth)).status).toBe(
      200,
    );
    expect(
      (await request(app).delete(`/api/events/${event.id}/staff/${staffId}`).set(admin)).status,
    ).toBe(200);
    expect((await request(app).get(`/api/checkins/lookup/${code}`).set(staffAuth)).status).toBe(
      403,
    );
  });
});
