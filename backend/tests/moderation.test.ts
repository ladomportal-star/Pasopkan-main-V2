import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.ts";
import { db } from "../src/config/database.ts";
import { as } from "./helpers/auth.ts";
import { createEvent } from "./helpers/seed.ts";

const app = createApp();
async function admin() {
  await db.user.upsert({
    where: { authId: "review-admin" },
    create: { authId: "review-admin", role: "admin" },
    update: {},
  });
  return as("review-admin");
}

describe("admin moderation boundaries", () => {
  it("records rejection reasons and allows resubmission", async () => {
    const owner = await as("rejected-host");
    const event = await createEvent(app, owner, { status: "pending_review" });
    const path = `/api/events/${event.id}`;
    expect(
      (
        await request(app)
          .put(path)
          .set(await admin())
          .send({ status: "rejected" })
      ).status,
    ).toBe(400);
    const rejected = await request(app)
      .put(path)
      .set(await admin())
      .send({ status: "rejected", rejectionReason: "Missing venue details" });
    expect(rejected.body.event.rejectionReason).toBe("Missing venue details");
    expect(
      (await request(app).put(path).set(owner).send({ rejectionReason: "Fake approval" })).status,
    ).toBe(403);
    const submitted = await request(app).put(path).set(owner).send({ status: "pending_review" });
    expect(submitted.body.event.rejectionReason).toBeNull();
    expect((await request(app).get("/api/admin/events").set(owner)).status).toBe(403);
    const queue = await request(app)
      .get("/api/admin/events")
      .set(await admin());
    expect(queue.body.events.some((e: { id: string }) => e.id === event.id)).toBe(true);
  });
  it("requires organizer approval before event creation", async () => {
    const headers = await as("new-applicant");
    await db.user.create({ data: { authId: "new-applicant" } });
    expect(
      (await request(app).post("/api/events").set(headers).send({ title: "Unapproved" })).status,
    ).toBe(403);
    const application = await request(app)
      .post("/api/organizer-applications")
      .set(headers)
      .send({ name: "New host" });
    expect(application.status).toBe(201);
    const path = `/api/admin/organizer-applications/${application.body.application.id}/review`;
    expect((await request(app).post(path).set(headers).send({ approve: true })).status).toBe(403);
    expect(
      (
        await request(app)
          .post(path)
          .set(await admin())
          .send({ approve: true })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .post(path)
          .set(await admin())
          .send({ approve: true })
      ).status,
    ).toBe(409);
    expect(
      (await request(app).post("/api/events").set(headers).send({ title: "Approved host draft" }))
        .status,
    ).toBe(201);
  });

  it("publishes only after submission and admin approval", async () => {
    const owner = await as("review-host");
    const event = await createEvent(app, owner, { status: "draft" });
    const path = `/api/events/${event.id}`;
    expect((await request(app).put(path).set(owner).send({ status: "published" })).status).toBe(
      403,
    );
    expect(
      (
        await request(app)
          .put(path)
          .set(await admin())
          .send({ status: "published" })
      ).status,
    ).toBe(409);
    expect(
      (await request(app).put(path).set(owner).send({ status: "pending_review" })).status,
    ).toBe(200);
    expect((await request(app).get(path)).status).toBe(404);
    expect(
      (
        await request(app)
          .put(path)
          .set(await admin())
          .send({ status: "published" })
      ).status,
    ).toBe(200);
    const edited = await request(app).put(path).set(owner).send({ title: "Needs another review" });
    expect(edited.body.event.status).toBe("pending_review");
    expect(await db.auditLog.count({ where: { entityId: event.id, action: "event.status" } })).toBe(
      3,
    );
  });

  it("cannot reopen or sell a cancelled event", async () => {
    const owner = await as("cancel-host");
    const event = await createEvent(app, owner);
    const headers = await admin();
    const cancel = `/api/admin/events/${event.id}/cancel`;
    expect((await request(app).post(cancel).set(owner)).status).toBe(403);
    expect((await request(app).post(cancel).set(headers)).status).toBe(200);
    expect((await request(app).post(cancel).set(headers)).status).toBe(200);
    expect(
      (
        await request(app)
          .put(`/api/events/${event.id}`)
          .set(headers)
          .send({ status: "pending_review" })
      ).status,
    ).toBe(409);
    expect(
      (
        await request(app)
          .post("/api/tickets")
          .set(owner)
          .send({ eventId: event.id, tierId: event.tiers[0].id, quantity: 1 })
      ).status,
    ).toBe(409);
    expect(
      await db.auditLog.count({ where: { entityId: event.id, action: "event.cancelled" } }),
    ).toBe(1);
  });
});
