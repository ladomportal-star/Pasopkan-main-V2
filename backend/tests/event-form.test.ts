import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.ts";
import { db } from "../src/config/database.ts";
import { as } from "./helpers/auth.ts";
import { createEvent } from "./helpers/seed.ts";
import { fromBackendEvent, toEventPayload } from "../../frontend/src/lib/eventPayload.ts";

const app = createApp();
const question = {
  id: "shirt",
  type: "single_choice",
  label: "Shirt size",
  required: true,
  options: ["S", "M"],
};
const guest = {
  firstName: "Test",
  lastName: "Guest",
  phone: "02012345678",
  email: "test@example.com",
  customAnswers: { shirt: "M" },
};
const order = async (buyer: string, event: { id: string; tiers: { id: string }[] }, extra = {}) =>
  request(app)
    .post("/api/tickets")
    .set(await as(buyer))
    .send({
      eventId: event.id,
      tierId: event.tiers[0].id,
      quantity: 1,
      ...extra,
    });

describe("organizer form database round-trip", () => {
  it.each(["fixed", "flexible", "booking"])(
    "persists all four form steps for %s dates",
    async (dateType) => {
      const owner = await as(`form-${dateType}`);
      await createEvent(app, owner, { status: "draft" });
      const form = {
        title: `Full ${dateType} draft`,
        status: "draft",
        description: "Real description",
        category: "Festival",
        eventType: "offline",
        organizer: "Host",
        organizerEmail: "host@example.com",
        venue: "Venue",
        location: "Address",
        province: "Vientiane",
        district: "Test",
        latitude: 18,
        longitude: 102,
        dateType,
        date: "01/12/2099",
        endDate: "02/12/2099",
        availableDates: [{ date: "01/12/2099", startTime: "09:00", endTime: "10:00" }],
        bookingAvailableDays: ["2099-12-01"],
        bookingTimeSlots: ["09:00"],
        bookingSlotCapacities: { "09:00": 2 },
        ticketTiers: [
          {
            name: "General",
            quantity: "10",
            price: "5,000",
            saleStartDate: "2099-11-01",
            saleEndDate: "2099-12-01",
          },
        ],
        coupons: [
          {
            code: "SAVE",
            type: "percentage",
            discount: 20,
            maxUses: 10,
            maxUsesPerUser: 1,
            maxDiscountAmount: 1000,
            validFrom: "01/11/2099",
            validUntil: "01/12/2099",
          },
        ],
        attendeeQuestions: [question],
        bankName: "private-bank",
        accountNumber: "private-account",
        onlinePasscode: "private-passcode",
        maxTickets: "unlimited",
        requireEveryTicketInfo: false,
        showRemainingTickets: false,
        allowRefunds: true,
        allowReviews: false,
        cancellationPolicy: "Policy",
      };
      const response = await request(app)
        .post("/api/events")
        .set(owner)
        .send({ ...toEventPayload(form), termsAccepted: true });
      expect(response.status, JSON.stringify(response.body)).toBe(201);
      const id = response.body.event.id;
      const row = await db.event.findUniqueOrThrow({
        where: { id },
        include: { tiers: true, dates: true, coupons: true, privateDetails: true },
      });
      expect(row.maxTicketsPerOrder).toBeNull();
      expect(row.requireEveryTicketInfo).toBe(false);
      expect(row.showRemainingTickets).toBe(false);
      expect(row.tiers[0].quantityTotal).toBe(10);
      expect(row.tiers[0].priceKip).toBe(5000);
      expect(row.coupons[0]).toMatchObject({
        maxRedemptions: 10,
        maxUsesPerUser: 1,
        maxDiscountAmount: 1000,
      });
      expect(row.coupons[0].startsAt?.toISOString()).toBe("2099-10-31T17:00:00.000Z");
      expect(row.coupons[0].expiresAt?.toISOString()).toBe("2099-12-01T16:59:59.999Z");
      expect(row.privateDetails?.attendeeQuestions).toEqual([question]);
      if (dateType !== "fixed")
        expect(row.dates[0].date.toISOString()).toBe("2099-12-01T00:00:00.000Z");
      if (dateType === "flexible") expect(row.startTime).toBe("09:00");
      if (dateType === "booking") expect(row.startTime).toBe("09:00");
      const loaded = fromBackendEvent(
        (await request(app).get(`/api/events/${id}`).set(owner)).body.event,
      );
      expect(loaded.maxTickets).toBe("unlimited");
      expect(loaded.coupons[0]).toMatchObject({
        maxUses: 10,
        maxUsesPerUser: 1,
        maxDiscountAmount: 1000,
        validFrom: "2099-11-01",
        validUntil: "2099-12-01",
      });
      expect(loaded.requireEveryTicketInfo).toBe(false);
      // Clearing fields must persist rather than silently retaining previous values.
      const updated = await request(app)
        .put(`/api/events/${id}`)
        .set(owner)
        .send(
          toEventPayload({
            ...loaded,
            description: "",
            bankName: "",
            accountNumber: "",
            coupons: [],
            requireEveryTicketInfo: true,
          }),
        );
      expect(updated.status).toBe(200);
      expect(updated.body.event.description).toBe("");
      expect(updated.body.event.privateDetails.accountNumber).toBeNull();
      expect(updated.body.event.requireEveryTicketInfo).toBe(true);
      expect(updated.body.event.coupons).toEqual([]);
      await db.event.update({ where: { id }, data: { status: "published" } });
      const publicEvent = (
        await request(app)
          .get(`/api/events/${id}`)
          .set(await as("form-catalog-reader"))
      ).body.event;
      expect(publicEvent.attendeeQuestions).toEqual([question]);
      expect(publicEvent).not.toHaveProperty("privateDetails");
      expect(JSON.stringify(publicEvent)).not.toContain("private-passcode");
      expect(fromBackendEvent(publicEvent).attendeeQuestions).toEqual([question]);
      const catalog = (
        await request(app)
          .get("/api/events?limit=100")
          .set(await as("form-catalog-reader"))
      ).body.events;
      expect(catalog.find((event: { id: string }) => event.id === id).attendeeQuestions).toEqual([
        question,
      ]);
    },
  );

  it("retains total ticket quantity instead of adding sold inventory twice", () => {
    const loaded = fromBackendEvent({
      title: "Existing",
      tiers: [{ name: "Tier", quantityTotal: 10, quantitySold: 3 }],
    });
    expect(toEventPayload(loaded).tiers).toMatchObject([{ quantityTotal: 10 }]);
  });
});

describe("server enforcement of organizer settings", () => {
  it("validates required guest answers before changing inventory", async () => {
    const event = await createEvent(app, await as("question-host"), {
      requireEveryTicketInfo: true,
      privateDetails: { attendeeQuestions: [question] },
      tiers: [{ name: "Free", priceKip: 0, quantityTotal: 3 }],
    });
    expect((await order("question-buyer", event)).status).toBe(422);
    expect(
      (
        await order("question-buyer", event, {
          attendees: [{ ...guest, customAnswers: { shirt: "BAD" } }],
        })
      ).status,
    ).toBe(422);
    const result = await order("question-buyer", event, { attendees: [guest] });
    expect(result.status).toBe(200);
    expect(result.body.items[0].customAnswers).toEqual({ shirt: "M" });
    expect(await db.order.count({ where: { eventId: event.id } })).toBe(1);
  });

  it("enforces sale dates and keeps stock unchanged for an early purchase", async () => {
    const event = await createEvent(app, await as("schedule-host"), {
      privateDetails: {
        ticketSaleWindows: [{ saleStartDate: "2099-01-01", saleStartTime: "09:00" }],
      },
    });
    expect((await order("schedule-buyer", event)).status).toBe(409);
    expect(
      (await db.ticketTier.findUniqueOrThrow({ where: { id: event.tiers[0].id } })).quantitySold,
    ).toBe(0);
  });

  it("calculates capped discounts on the server and enforces per-user coupon limits", async () => {
    const event = await createEvent(app, await as("coupon-host"), {
      tiers: [{ name: "Paid", priceKip: 1000, quantityTotal: 5 }],
      coupons: [
        {
          code: "HALF",
          discountType: "percent",
          discountValue: 50,
          maxDiscountAmount: 200,
          maxUsesPerUser: 1,
        },
      ],
    });
    const result = await order("coupon-buyer", event, { couponCode: "half", discountKip: 9999 });
    expect(result.status).toBe(200);
    expect(result.body.order).toMatchObject({
      subtotalKip: 1000,
      discountKip: 200,
      totalKip: 800,
      status: "pending",
      couponCode: "HALF",
    });
    expect((await order("coupon-buyer", event, { couponCode: "HALF" })).status).toBe(422);
  });

  it("cannot redeem a last-use coupon twice concurrently or use an expired coupon", async () => {
    const event = await createEvent(app, await as("limited-coupon-host"), {
      tiers: [{ name: "Paid", priceKip: 1000, quantityTotal: 5 }],
      coupons: [
        { code: "FREE", discountType: "percent", discountValue: 100, maxRedemptions: 1 },
        {
          code: "OLD",
          discountType: "fixed",
          discountValue: 1000,
          expiresAt: "2000-01-01T00:00:00.000Z",
        },
      ],
    });
    const results = await Promise.all([
      order("coupon-race-1", event, { couponCode: "FREE", freeOnly: true }),
      order("coupon-race-2", event, { couponCode: "FREE", freeOnly: true }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 422]);
    expect(results.find((r) => r.status === 200)?.body.order).toMatchObject({
      totalKip: 0,
      status: "confirmed",
    });
    expect((await order("coupon-race-3", event, { couponCode: "OLD" })).status).toBe(422);
    expect(await db.order.count({ where: { eventId: event.id } })).toBe(1);
  });

  it("limits booking session capacity across ticket types", async () => {
    const event = await createEvent(app, await as("booking-host"), {
      dateType: "booking",
      dates: [{ date: "2099-12-01", timeSlots: ["09:00"] }],
      privateDetails: { bookingSlotCapacities: { "09:00": 1 } },
      tiers: [
        { name: "Free A", priceKip: 0, quantityTotal: 10 },
        { name: "Free B", priceKip: 0, quantityTotal: 10 },
      ],
    });
    expect(
      (await order("booking-buyer", event, { selectedDate: "2099-12-01", selectedTime: "10:00" }))
        .status,
    ).toBe(422);
    const results = await Promise.all([
      order("booking-race-1", event, { selectedDate: "2099-12-01", selectedTime: "09:00" }),
      order("booking-race-2", event, {
        tierId: event.tiers[1].id,
        selectedDate: "2099-12-01",
        selectedTime: "09:00",
      }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
  });
});
