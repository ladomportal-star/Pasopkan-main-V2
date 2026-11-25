import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.ts";
import { db } from "../src/config/database.ts";
import { as } from "./helpers/auth.ts";
import { createEvent, submissionProofFor } from "./helpers/seed.ts";

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
  it("lets an approved organizer draft before phone OTP but still blocks unverified submission", async () => {
    const uid = "unverified-organizer";
    const headers = await as(uid);
    const user = await db.user.create({
      data: { authId: uid, phone: "+8562012345678", role: "organizer" },
    });
    await db.organizer.create({ data: { userId: user.id, name: "Unverified host" } });

    const eligibility = await request(app).get("/api/organizer/eligibility").set(headers);
    expect(eligibility.status).toBe(200);
    expect(eligibility.body).toMatchObject({ canCreateEvent: true });
    expect(eligibility.body.phoneVerified).toBeUndefined();
    expect(
      (await request(app).post("/api/organizer-applications").set(headers).send({ name: "Host" }))
        .status,
    ).toBe(403);
    const draft = await request(app)
      .post("/api/events")
      .set(headers)
      .send({ title: "Draft before OTP", termsAccepted: true });
    expect(draft.status).toBe(201);
    expect(
      (
        await request(app).put(`/api/events/${draft.body.event.id}`).set(headers).send({
          status: "pending_review",
          termsAccepted: true,
        })
      ).status,
    ).toBe(403);
  });

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
    const submitted = await request(app)
      .put(path)
      .set(owner)
      .send({
        status: "pending_review",
        termsAccepted: true,
        submissionOtp: await submissionProofFor(owner),
      });
    expect(submitted.body.event.rejectionReason).toBeNull();
    expect((await request(app).get("/api/admin/events").set(owner)).status).toBe(403);
    const queue = await request(app)
      .get("/api/admin/events")
      .set(await admin());
    expect(queue.body.events.some((e: { id: string }) => e.id === event.id)).toBe(true);
  });
  it("lets registered users create drafts and requires admin review before publication", async () => {
    const headers = await as("new-applicant");
    await db.user.create({ data: { authId: "new-applicant" } });
    const adminHeaders = await admin();
    const activate = await request(app).post("/api/organizer/activate").set(headers);
    expect(activate.status).toBe(200);
    expect(activate.body.role).toBe("organizer");
    const activateAgain = await request(app).post("/api/organizer/activate").set(headers);
    expect(activateAgain.status).toBe(200);
    expect(activateAgain.body.organizer.id).toBe(activate.body.organizer.id);
    expect(
      await db.user.findUnique({
        where: { authId: "new-applicant" },
        include: { organizer: true },
      }),
    ).toMatchObject({ role: "organizer", organizer: { name: "Organizer" } });
    const eligibility = await request(app).get("/api/organizer/eligibility").set(headers);
    expect(eligibility.body.canCreateEvent).toBe(true);

    const draft = await request(app)
      .post("/api/events")
      .set(headers)
      .send({ title: "My first draft", termsAccepted: true });
    expect(draft.status).toBe(201);
    expect(draft.body.event.status).toBe("draft");
    const eventId = draft.body.event.id;
    expect(
      (await request(app).put(`/api/events/${eventId}`).set(headers).send({ status: "published" }))
        .status,
    ).toBe(403);

    const submission = await request(app)
      .put(`/api/events/${eventId}`)
      .set(headers)
      .send({
        status: "pending_review",
        termsAccepted: true,
        submissionOtp: await submissionProofFor(headers),
      });
    expect(submission.status).toBe(200);
    expect(submission.body.event.status).toBe("pending_review");
    expect(
      (
        await request(app)
          .put(`/api/events/${eventId}`)
          .set(adminHeaders)
          .send({ status: "published" })
      ).status,
    ).toBe(200);
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
      (
        await request(app)
          .put(path)
          .set(owner)
          .send({
            status: "pending_review",
            termsAccepted: true,
            submissionOtp: await submissionProofFor(owner),
          })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .get(path)
          .set(await as("review-reader"))
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .put(path)
          .set(await admin())
          .send({ status: "published" })
      ).status,
    ).toBe(200);
    const edited = await request(app)
      .put(path)
      .set(owner)
      .send({
        title: "Needs another review",
        termsAccepted: true,
        submissionOtp: await submissionProofFor(owner),
      });
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

  it("sends organizer content edits on a live event back to review", async () => {
    const owner = await as("live-edit-host");
    const event = await createEvent(app, owner);
    const path = `/api/events/${event.id}`;
    const stored = () => db.event.findUniqueOrThrow({ where: { id: event.id } });

    // Without a fresh OTP the change is refused and the live listing is untouched.
    expect(
      (await request(app).put(path).set(owner).send({ title: "Bait and switch" })).status,
    ).toBe(403);
    expect(await stored()).toMatchObject({ status: "published", title: "That Luang Festival" });

    // A live event with sales cannot be quietly pulled back to draft.
    expect((await request(app).put(path).set(owner).send({ status: "draft" })).status).toBe(409);
    expect((await stored()).status).toBe("published");

    // Coupons and the organizer's public links stay editable while on sale, but
    // the payout account cannot be changed through that shortcut.
    const operational = await request(app)
      .put(path)
      .set(owner)
      .send({
        coupons: [{ code: "EARLY10", discountType: "percent", discountValue: 10 }],
        privateDetails: {
          accountNumber: "ATTACKER-0001",
          organizerSocialLinks: { facebook: "https://facebook.com/host" },
        },
      });
    expect(operational.status).toBe(200);
    expect(operational.body.event.status).toBe("published");
    expect(operational.body.event.coupons.map((c: { code: string }) => c.code)).toEqual([
      "EARLY10",
    ]);
    const details = await db.eventPrivateDetails.findUniqueOrThrow({
      where: { eventId: event.id },
    });
    expect(details.accountNumber).not.toBe("ATTACKER-0001");
    expect(details.organizerSocialLinks).toEqual({ facebook: "https://facebook.com/host" });
    expect(
      await db.auditLog.count({ where: { entityId: event.id, action: "event.live_update" } }),
    ).toBe(1);

    // With a fresh OTP the content change is accepted but goes back to admin review.
    const edited = await request(app)
      .put(path)
      .set(owner)
      .send({
        title: "Changed after approval",
        termsAccepted: true,
        submissionOtp: await submissionProofFor(owner),
      });
    expect(edited.status).toBe(200);
    expect(edited.body.event.status).toBe("pending_review");
  });
});
