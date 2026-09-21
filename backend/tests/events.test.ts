import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.ts";
import { db } from "../src/config/database.ts";
import { users } from "../src/models/schema.ts";
import { as } from "./helpers/auth.ts";
import { createEvent } from "./helpers/seed.ts";

const app = createApp();

describe("events", () => {
  it("requires sign-in to create, and validates the body", async () => {
    expect((await request(app).post("/api/events").send({ title: "x" })).status).toBe(401);
    const bad = await request(app)
      .post("/api/events")
      .set(await as("org-1"))
      .send({});
    expect(bad.status).toBe(400);
    expect(bad.body.details).toHaveProperty("title");
  });

  it("creates an event with tiers, owned by its creator", async () => {
    const event = await createEvent(app, await as("org-1"), { title: "Owned" });
    expect(event.tiers).toHaveLength(2);
    const mine = await request(app)
      .get("/api/events?mine=true")
      .set(await as("org-1"));
    expect(mine.body.events.map((e: { title: string }) => e.title)).toContain("Owned");
  });

  it("hides drafts from the public catalog and from other users, but not from the owner", async () => {
    const owner = await as("org-2");
    const draft = await createEvent(app, owner, { title: "Secret Draft", status: "draft" });

    const pub = await request(app).get("/api/events");
    expect(pub.body.events.map((e: { title: string }) => e.title)).not.toContain("Secret Draft");

    expect((await request(app).get(`/api/events/${draft.id}`)).status).toBe(404);
    expect(
      (
        await request(app)
          .get(`/api/events/${draft.id}`)
          .set(await as("stranger"))
      ).status,
    ).toBe(404);
    expect((await request(app).get(`/api/events/${draft.id}`).set(owner)).status).toBe(200);
  });

  it("lists published events publicly and resolves them by id", async () => {
    const event = await createEvent(app, await as("org-3"), { title: "Public Show" });
    const list = await request(app).get("/api/events");
    expect(list.body.events.map((e: { title: string }) => e.title)).toContain("Public Show");
    const one = await request(app).get(`/api/events/${event.id}`);
    expect(one.status).toBe(200);
    expect(one.body.event.title).toBe("Public Show");
  });

  it("`mine=true` needs a sign-in", async () => {
    expect((await request(app).get("/api/events?mine=true")).status).toBe(401);
  });

  it("only the owner (or an admin) may update an event", async () => {
    const owner = await as("org-4");
    const event = await createEvent(app, owner, { title: "Before" });

    const stranger = await request(app)
      .put(`/api/events/${event.id}`)
      .set(await as("stranger"))
      .send({ title: "Hacked" });
    expect(stranger.status).toBe(403);

    const byOwner = await request(app)
      .put(`/api/events/${event.id}`)
      .set(owner)
      .send({ title: "After" });
    expect(byOwner.status).toBe(200);
    expect(byOwner.body.event.title).toBe("After");
    expect(byOwner.body.event.tiers).toHaveLength(2); // untouched when not sent

    await db.insert(users).values({ firebaseUid: "admin-1", email: "a@test.local", role: "admin" });
    const byAdmin = await request(app)
      .put(`/api/events/${event.id}`)
      .set(await as("admin-1"))
      .send({ title: "Moderated" });
    expect(byAdmin.status).toBe(200);
  });

  it("404s when updating an unknown event", async () => {
    const res = await request(app)
      .put("/api/events/does-not-exist")
      .set(await as("org-5"))
      .send({ title: "x" });
    expect(res.status).toBe(404);
  });
});
