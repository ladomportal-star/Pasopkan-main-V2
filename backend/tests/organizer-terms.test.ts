import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.ts";
import { db } from "../src/config/database.ts";
import { as } from "./helpers/auth.ts";

const app = createApp();

describe("organizer terms acceptance", () => {
  it("persists one acceptance per organizer account and reuses it for future events", async () => {
    const headers = await as("terms-once-organizer");
    const user = await db.user.create({
      data: { authId: "terms-once-organizer", role: "organizer" },
    });
    await db.organizer.create({ data: { userId: user.id, name: "Host" } });

    const before = await request(app).get("/api/organizer/terms-acceptance").set(headers);
    expect(before.status).toBe(200);
    expect(before.body.accepted).toBe(false);
    expect(
      (await request(app).post("/api/events").set(headers).send({ title: "Before terms" })).status,
    ).toBe(400);
    expect(
      (await request(app).post("/api/organizer/terms-acceptance").set(headers).send({ accepted: false })).status,
    ).toBe(400);

    const first = await request(app)
      .post("/api/organizer/terms-acceptance")
      .set(headers)
      .send({ accepted: true });
    expect(first.status).toBe(200);
    expect(first.body.accepted).toBe(true);
    expect(first.body.acceptedAt).toBeTruthy();

    const again = await request(app)
      .post("/api/organizer/terms-acceptance")
      .set(headers)
      .send({ accepted: true });
    expect(again.status).toBe(200);
    expect(again.body.acceptedAt).toBe(first.body.acceptedAt);
    expect(
      await db.auditLog.count({
        where: { actorId: user.id, action: "organizer.terms_accepted" },
      }),
    ).toBe(1);
    expect(
      (await request(app).get("/api/organizer/terms-acceptance").set(headers)).body.accepted,
    ).toBe(true);

    for (const title of ["First event", "Second event"]) {
      const created = await request(app)
        .post("/api/events")
        .set(headers)
        .send({ title, status: "draft" });
      expect(created.status).toBe(201);
    }
  });

  it("does not allow an unapproved account to record organizer acceptance", async () => {
    const headers = await as("not-organizer-terms");
    await db.user.create({ data: { authId: "not-organizer-terms" } });
    expect(
      (await request(app).get("/api/organizer/terms-acceptance").set(headers)).status,
    ).toBe(403);
    expect(
      (await request(app).post("/api/organizer/terms-acceptance").set(headers).send({ accepted: true })).status,
    ).toBe(403);
  });
});
