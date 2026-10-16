import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.ts";
import { db } from "../src/config/database.ts";
import { as } from "./helpers/auth.ts";
import { createEvent, submissionProofFor } from "./helpers/seed.ts";
import { requireVerifiedPhone } from "../src/services/verified-phone.service.ts";

const app = createApp();

describe("events", () => {
  it("sends the submission OTP only after an unverified approved organizer has drafted", async () => {
    const uid = "unverified-submit-host";
    const owner = await as(uid);
    const user = await db.user.create({ data: { authId: uid, role: "organizer" } });
    await db.organizer.create({ data: { userId: user.id, name: "Host" } });
    const draft = await request(app).post("/api/events").set(owner).send({
      title: "Draft first",
      status: "draft",
      termsAccepted: true,
    });
    expect(draft.status).toBe(201);

    const realFetch = globalThis.fetch;
    let sentCode = "";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      if (String(input).includes("apimicroservices.wenova.fun")) {
        sentCode =
          (JSON.parse(String(init?.body)) as { message: string }).message.match(/\d{6}$/)?.[0] ??
          "";
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, data: { resultCode: 20000 } }), {
            status: 200,
          }),
        );
      }
      return realFetch(input, init);
    });
    try {
      const phone = "+8562012345678";
      const sent = await request(app)
        .post("/api/organizer/event-submission-otp")
        .set(owner)
        .send({ phone });
      expect(sent.status).toBe(200);
      expect(sentCode).toMatch(/^\d{6}$/);
      const proof = { challengeId: sent.body.challengeId, code: sentCode };
      const submitted = await request(app)
        .put(`/api/events/${draft.body.event.id}`)
        .set(owner)
        .send({
          status: "pending_review",
          termsAccepted: true,
          submissionOtp: proof,
        });
      expect(submitted.status).toBe(200);
      expect(submitted.body.event.status).toBe("pending_review");
      expect(
        (
          await request(app).put(`/api/events/${draft.body.event.id}`).set(owner).send({
            status: "pending_review",
            termsAccepted: true,
            submissionOtp: proof,
          })
        ).status,
      ).toBe(403);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("remembers accepted terms but still requires a fresh one-use SMS code when submitting", async () => {
    const owner = await as("otp-submission-host");
    const event = await createEvent(app, owner, { status: "draft" });
    const path = `/api/events/${event.id}`;
    expect(
      (await request(app).post("/api/events").set(owner).send({ title: "Terms already accepted" })).status,
    ).toBe(201);
    expect(
      (await request(app).put(path).set(owner).send({ status: "pending_review" })).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .put(path)
          .set(owner)
          .send({ status: "pending_review", termsAccepted: true })
      ).status,
    ).toBe(403);

    const phone = await requireVerifiedPhone("otp-submission-host");
    const wrongPhone = phone === "+8562012345678" ? "+8562087654321" : "+8562012345678";
    expect(
      (
        await request(app)
          .post("/api/organizer/event-submission-otp")
          .set(owner)
          .send({ phone: wrongPhone })
      ).status,
    ).toBe(400);
    const realFetch = globalThis.fetch;
    let sentCode = "";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      if (String(input).includes("apimicroservices.wenova.fun")) {
        const body = JSON.parse(String(init?.body)) as { message: string };
        sentCode = body.message.match(/\d{6}$/)?.[0] ?? "";
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, data: { resultCode: 20000 } }), {
            status: 200,
          }),
        );
      }
      return realFetch(input, init);
    });
    try {
      const sent = await request(app)
        .post("/api/organizer/event-submission-otp")
        .set(owner)
        .send({ phone });
      expect(sent.status).toBe(200);
      expect(sent.body.challengeId).toBeTruthy();
      expect(sentCode).toMatch(/^\d{6}$/);
      const proof = { challengeId: sent.body.challengeId, code: sentCode };
      expect(
        (
          await request(app)
            .put(path)
            .set(owner)
            .send({
              status: "pending_review",
              termsAccepted: true,
              submissionOtp: { ...proof, code: sentCode === "000000" ? "000001" : "000000" },
            })
        ).status,
      ).toBe(403);
      expect(
        (
          await request(app)
            .put(path)
            .set(owner)
            .send({ status: "pending_review", termsAccepted: true, submissionOtp: proof })
        ).status,
      ).toBe(200);
      expect(
        (
          await request(app)
            .put(path)
            .set(owner)
            .send({ status: "pending_review", termsAccepted: true, submissionOtp: proof })
        ).status,
      ).toBe(403);
      expect(
        (await request(app).post("/api/organizer/event-submission-otp").set(owner).send({ phone }))
          .status,
      ).toBe(429);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("keeps an uncertain SMS challenge usable instead of automatically resending", async () => {
    const owner = await as("uncertain-sms-host");
    const event = await createEvent(app, owner, { status: "draft" });
    const phone = await requireVerifiedPhone("uncertain-sms-host");
    const realFetch = globalThis.fetch;
    let sentCode = "";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      if (String(input).includes("apimicroservices.wenova.fun")) {
        sentCode =
          (JSON.parse(String(init?.body)) as { message: string }).message.match(/\d{6}$/)?.[0] ??
          "";
        return Promise.reject(new Error("provider response timed out"));
      }
      return realFetch(input, init);
    });
    try {
      const sent = await request(app)
        .post("/api/organizer/event-submission-otp")
        .set(owner)
        .send({ phone });
      expect(sent.status).toBe(200);
      expect(sent.body.deliveryUncertain).toBe(true);
      expect(sentCode).toMatch(/^\d{6}$/);
      const submitted = await request(app)
        .put(`/api/events/${event.id}`)
        .set(owner)
        .send({
          status: "pending_review",
          termsAccepted: true,
          submissionOtp: { challengeId: sent.body.challengeId, code: sentCode },
        });
      expect(submitted.status).toBe(200);
    } finally {
      fetchSpy.mockRestore();
    }
  });
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

  it("persists draft form data while keeping payment and meeting details owner-only", async () => {
    const owner = await as("org-private-form");
    await createEvent(app, owner, { title: "Organizer setup" });
    const created = await request(app)
      .post("/api/events")
      .set(owner)
      .send({
        title: "Real draft",
        status: "draft",
        termsAccepted: true,
        eventPrivacy: "private",
        durationEn: "Two hours",
        cancellationPolicy: "No refunds",
        hasSeating: true,
        organizer: { name: "Real organizer", contactPhone: "2012345678" },
        privateDetails: {
          bankName: "Actual bank",
          accountNumber: "private-account",
          onlinePasscode: "private-passcode",
          bookingSlotCapacities: { "10:00": 12 },
          attendeeQuestions: [{ label: "Name", type: "text", required: true }],
        },
      });
    expect(created.status).toBe(201);
    const id = created.body.event.id;
    expect(created.body.event.privateDetails.accountNumber).toBe("private-account");
    expect(created.body.event.hasSeating).toBe(true);
    expect(created.body.event.organizer.name).toBe("Real organizer");
    const updated = await request(app)
      .put(`/api/events/${id}`)
      .set(owner)
      .send({
        title: "Real draft updated",
        privateDetails: { accountNumber: "new-account" },
      });
    expect(updated.status).toBe(200);
    expect(updated.body.event.privateDetails.accountNumber).toBe("new-account");
    expect((await request(app).get(`/api/events/${id}`)).status).toBe(404);
    expect(
      (await request(app).get(`/api/events/${id}`).set(owner)).body.event.privateDetails
        .accountNumber,
    ).toBe("new-account");
    const submitted = await request(app)
      .put(`/api/events/${id}`)
      .set(owner)
      .send({
        status: "pending_review",
        termsAccepted: true,
        submissionOtp: await submissionProofFor(owner),
      });
    expect(submitted.body.event.status).toBe("pending_review");
    const admin = await as("admin-private-form");
    await db.user.create({ data: { authId: "admin-private-form", role: "admin" } });
    expect(
      (await request(app).put(`/api/events/${id}`).set(admin).send({ status: "published" })).status,
    ).toBe(200);
    expect((await request(app).get(`/api/events/${id}`)).status).toBe(404);
    expect(
      (await request(app).get("/api/events")).body.events.some((e: { id: string }) => e.id === id),
    ).toBe(false);
    const publicEvent = await request(app)
      .post("/api/events")
      .set(owner)
      .send({
        title: "Public with private payment",
        status: "pending_review",
        termsAccepted: true,
        submissionOtp: await submissionProofFor(owner),
        privateDetails: { accountNumber: "never-public" },
      });
    expect(publicEvent.status).toBe(201);
    const publicId = publicEvent.body.event.id;
    expect(
      (await request(app).put(`/api/events/${publicId}`).set(admin).send({ status: "published" }))
        .status,
    ).toBe(200);
    expect((await request(app).get(`/api/events/${publicId}`)).body.event).not.toHaveProperty(
      "privateDetails",
    );
    const publicList = await request(app).get("/api/events");
    expect(
      publicList.body.events.find((e: { id: string }) => e.id === publicId),
    ).not.toHaveProperty("privateDetails");
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

  it("paginates only the signed-in organizer's events", async () => {
    const firstOwner = await as("paging-organizer-a");
    const secondOwner = await as("paging-organizer-b");
    const first = await createEvent(app, firstOwner, { title: "First owner event" });
    const second = await createEvent(app, firstOwner, { title: "Second owner event" });
    const unrelated = await createEvent(app, secondOwner, { title: "Other owner event" });

    const pageOne = await request(app).get("/api/events?mine=true&limit=1").set(firstOwner);
    expect(pageOne.status).toBe(200);
    expect(pageOne.body.events).toHaveLength(1);
    expect(pageOne.body.nextCursor).toBeTruthy();
    const pageTwo = await request(app)
      .get(`/api/events?mine=true&limit=1&cursor=${pageOne.body.nextCursor}`)
      .set(firstOwner);
    expect(pageTwo.status).toBe(200);
    expect(pageTwo.body.nextCursor).toBeNull();
    expect([pageOne.body.events[0].id, pageTwo.body.events[0].id].sort()).toEqual(
      [first.id, second.id].sort(),
    );
    expect([pageOne.body.events[0].id, pageTwo.body.events[0].id]).not.toContain(unrelated.id);
    expect(
      (
        await request(app)
          .get("/api/events?mine=true")
          .set(await as("ordinary-user"))
      ).body.events,
    ).toEqual([]);
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
      .send({
        title: "After",
        termsAccepted: true,
        submissionOtp: await submissionProofFor(owner),
      });
    expect(byOwner.status).toBe(200);
    expect(byOwner.body.event.title).toBe("After");
    expect(byOwner.body.event.tiers).toHaveLength(2); // untouched when not sent

    await db.user.create({ data: { authId: "admin-1", email: "a@test.local", role: "admin" } });
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

  it("lets an admin without an application create, review and edit events", async () => {
    const admin = await as("admin-without-organizer");
    const adminUser = await db.user.create({
      data: {
        authId: "admin-without-organizer",
        email: "admin-without-organizer@test.local",
        role: "admin",
      },
    });
    const created = await request(app)
      .post("/api/events")
      .set(admin)
      .send({
        title: "Platform event",
        status: "pending_review",
        tiers: [{ name: "Free", priceKip: 0, quantityTotal: 10 }],
      });
    expect(created.status).toBe(201);
    expect(created.body.event.status).toBe("pending_review");
    expect(created.body.event.organizer.userId).toBe(adminUser.id);
    expect((await db.user.findUnique({ where: { id: adminUser.id } }))?.role).toBe("admin");
    expect(await db.organizerApplication.count({ where: { userId: adminUser.id } })).toBe(0);
    const published = await request(app)
      .put(`/api/events/${created.body.event.id}`)
      .set(admin)
      .send({ status: "published" });
    expect(published.status).toBe(200);
    expect(published.body.event.reviewedByUserId).toBe(adminUser.id);
    expect(
      await db.auditLog.count({
        where: { actorId: adminUser.id, action: "event.status", entityId: created.body.event.id },
      }),
    ).toBe(1);

    const owned = await createEvent(app, await as("other-organizer"), {
      title: "Another host's show",
    });
    const list = await request(app).get("/api/admin/events?limit=1").set(admin);
    expect(list.status).toBe(200);
    expect(list.body.events).toHaveLength(1);
    expect(list.body.nextCursor).toBeTruthy();
    const secondPage = await request(app)
      .get(`/api/admin/events?limit=1&cursor=${list.body.nextCursor}`)
      .set(admin);
    expect(secondPage.status).toBe(200);
    expect(secondPage.body.events[0].id).not.toBe(list.body.events[0].id);
    const all = await request(app).get("/api/admin/events?limit=100").set(admin);
    expect(all.body.events.map((event: { id: string }) => event.id)).toContain(owned.id);
    const edited = await request(app)
      .put(`/api/events/${owned.id}`)
      .set(admin)
      .send({ title: "Updated by admin" });
    expect(edited.status).toBe(200);
    expect(edited.body.event.title).toBe("Updated by admin");
  });

  it("does not let a regular user inherit organizer privileges from an old profile", async () => {
    const owner = await as("former-organizer");
    const event = await createEvent(app, owner, { status: "draft" });
    await db.user.update({ where: { authId: "former-organizer" }, data: { role: "user" } });
    expect(
      (await request(app).post("/api/events").set(owner).send({ title: "Unauthorized" })).status,
    ).toBe(403);
    expect(
      (await request(app).put(`/api/events/${event.id}`).set(owner).send({ title: "Unauthorized" }))
        .status,
    ).toBe(403);
    expect((await request(app).get(`/api/events/${event.id}`).set(owner)).status).toBe(404);
    expect((await request(app).get("/api/events?mine=true").set(owner)).body.events).toHaveLength(
      0,
    );
    expect(
      (
        await request(app)
          .post(`/api/events/${event.id}/staff`)
          .set(owner)
          .send({ email: "somebody@test.local" })
      ).status,
    ).toBe(403);
  });
});
