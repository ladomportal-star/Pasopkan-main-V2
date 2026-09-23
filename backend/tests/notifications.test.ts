import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.ts";
import { db } from "../src/config/database.ts";
import { users } from "../src/models/schema.ts";
import { createNotification } from "../src/services/notification.service.ts";
import { as } from "./helpers/auth.ts";
import { createEvent } from "./helpers/seed.ts";

const app = createApp();
const inbox = async (user: string, query = "") =>
  request(app)
    .get(`/api/notifications${query}`)
    .set(await as(user));

describe("notifications (database-backed, per user)", () => {
  it("requires sign-in on every route", async () => {
    expect((await request(app).get("/api/notifications")).status).toBe(401);
    expect((await request(app).post("/api/notifications/read-all")).status).toBe(401);
    expect((await request(app).delete("/api/notifications")).status).toBe(401);
  });

  it("starts empty: there is no seeded or mock data", async () => {
    const res = await inbox("fresh-user");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ notifications: [], unreadCount: 0 });
  });

  it("returns only the caller's notifications, newest first, with unread count", async () => {
    await createNotification("alice", { title: "First", message: "1" });
    await createNotification("alice", {
      type: "promo",
      title: "Second",
      titleLo: "ສອງ",
      message: "2",
    });
    await createNotification("bob", { title: "Not yours", message: "x" });

    const res = await inbox("alice");
    expect(res.body.notifications.map((n: { title: string }) => n.title)).toEqual([
      "Second",
      "First",
    ]);
    expect(res.body.unreadCount).toBe(2);
    expect(res.body.notifications[0]).toMatchObject({
      type: "promo",
      titleLo: "ສອງ",
      isUnread: true,
    });
    expect(typeof res.body.notifications[0].createdAt).toBe("string");
  });

  it("marks one read, then all read", async () => {
    await createNotification("carol", { title: "A", message: "a" });
    await createNotification("carol", { title: "B", message: "b" });
    const [first] = (await inbox("carol")).body.notifications;

    const read = await request(app)
      .patch(`/api/notifications/${first.id}/read`)
      .set(await as("carol"));
    expect(read.status).toBe(200);
    expect((await inbox("carol")).body.unreadCount).toBe(1);
    expect((await inbox("carol", "?unread=true")).body.notifications).toHaveLength(1);

    const all = await request(app)
      .post("/api/notifications/read-all")
      .set(await as("carol"));
    expect(all.body.updated).toBe(1);
    expect((await inbox("carol")).body.unreadCount).toBe(0);
  });

  it("cannot read or delete someone else's notification (404, and it survives)", async () => {
    await createNotification("dave", { title: "Private", message: "p" });
    const [mine] = (await inbox("dave")).body.notifications;

    const read = await request(app)
      .patch(`/api/notifications/${mine.id}/read`)
      .set(await as("mallory"));
    const del = await request(app)
      .delete(`/api/notifications/${mine.id}`)
      .set(await as("mallory"));
    expect(read.status).toBe(404);
    expect(del.status).toBe(404);
    expect((await inbox("dave")).body.notifications).toHaveLength(1);
  });

  it("deletes one and clears all", async () => {
    await createNotification("erin", { title: "A", message: "a" });
    await createNotification("erin", { title: "B", message: "b" });
    const [first] = (await inbox("erin")).body.notifications;

    const del = await request(app)
      .delete(`/api/notifications/${first.id}`)
      .set(await as("erin"));
    expect(del.status).toBe(200);
    expect((await inbox("erin")).body.notifications).toHaveLength(1);

    const clear = await request(app)
      .delete("/api/notifications")
      .set(await as("erin"));
    expect(clear.body.deleted).toBe(1);
    expect((await inbox("erin")).body.notifications).toHaveLength(0);
  });

  it("rejects a malformed id", async () => {
    const res = await request(app)
      .patch("/api/notifications/not-a-uuid/read")
      .set(await as("erin"));
    expect(res.status).toBe(400);
  });

  it("is created by real activity: buyer and organizer are both notified of an order", async () => {
    const event = await createEvent(app, await as("host"), { title: "Night Market" });
    const buy = await request(app)
      .post("/api/tickets")
      .set(await as("guest-buyer"))
      .send({ eventId: event.id, tierId: "Free", quantity: 2 });
    expect(buy.status).toBe(200);

    const buyer = (await inbox("guest-buyer")).body.notifications;
    expect(buyer).toHaveLength(1);
    expect(buyer[0]).toMatchObject({ type: "ticket", isUnread: true });
    expect(buyer[0].message).toContain("Night Market");
    expect(buyer[0].data).toMatchObject({ eventId: event.id, orderId: buy.body.order.id });

    const host = (await inbox("host")).body.notifications;
    expect(host).toHaveLength(1);
    expect(host[0].title).toBe("New ticket order");
  });

  it("POST /api/notifications: only an admin may push a notification to another user", async () => {
    const body = { userUid: "target-user", title: "Event Approved", message: "Congrats" };

    expect((await request(app).post("/api/notifications").send(body)).status).toBe(401);
    expect(
      (
        await request(app)
          .post("/api/notifications")
          .set(await as("nobody-special"))
          .send(body)
      ).status,
    ).toBe(403);

    await db
      .insert(users)
      .values({ firebaseUid: "the-admin", email: "admin@test.local", role: "admin" });

    const bad = await request(app)
      .post("/api/notifications")
      .set(await as("the-admin"))
      .send({});
    expect(bad.status).toBe(400);

    const res = await request(app)
      .post("/api/notifications")
      .set(await as("the-admin"))
      .send(body);
    expect(res.status).toBe(201);
    expect(res.body.notification).toMatchObject({ title: "Event Approved", isUnread: true });

    const target = (await inbox("target-user")).body.notifications;
    expect(target).toHaveLength(1);
    expect(target[0].title).toBe("Event Approved");
  });
});
