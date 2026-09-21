import { describe, it, expect } from "vitest";
import request from "supertest";
import { eq, sql } from "drizzle-orm";
import { createApp } from "../src/app.ts";
import { db } from "../src/config/database.ts";
import { orders, ticketTiers } from "../src/models/schema.ts";
import { releaseExpiredOrders } from "../src/services/ticket.service.ts";
import { as } from "./helpers/auth.ts";
import { createEvent } from "./helpers/seed.ts";

const app = createApp();
const buy = async (buyer: string, body: Record<string, unknown>) =>
  request(app)
    .post("/api/tickets")
    .set(await as(buyer))
    .send(body);

describe("tickets", () => {
  it("requires sign-in and a valid body", async () => {
    expect((await request(app).post("/api/tickets").send({})).status).toBe(401);
    const res = await buy("b1", { eventId: "x" });
    expect(res.status).toBe(400);
    expect(res.body.details).toHaveProperty("quantity");
  });

  it("404s for an event that does not exist (no phantom orders)", async () => {
    expect((await buy("b1", { eventId: "nope", tierId: "General", quantity: 1 })).status).toBe(404);
  });

  it("409s when the event is not on sale", async () => {
    const draft = await createEvent(app, await as("org"), { status: "draft" });
    expect(
      (await buy("b1", { eventId: draft.id, tierId: draft.tiers[0].id, quantity: 1 })).status,
    ).toBe(409);
  });

  it("takes the price from the database, never from the client", async () => {
    const event = await createEvent(app, await as("org"));
    const general = event.tiers.find((t) => t.name === "General")!;
    const res = await buy("b2", {
      eventId: event.id,
      tierId: general.id,
      quantity: 3,
      price: 1,
      eventTitle: "lies",
    });
    expect(res.status).toBe(200);
    expect(res.body.order.totalKip).toBe(300000);
    expect(res.body.order.eventTitle).toBe("That Luang Festival");
    expect(res.body.items).toHaveLength(3);
    expect(res.body.items[0].ticketCode).toMatch(/^PSK-/);
    expect(res.body.items.every((i: { unitPriceKip: number }) => i.unitPriceKip === 100000)).toBe(
      true,
    );
  });

  it("leaves a paid order pending until the gateway confirms; free orders are confirmed at once", async () => {
    const event = await createEvent(app, await as("org"));
    const paid = await buy("b3", { eventId: event.id, tierId: "General", quantity: 1 });
    expect(paid.body.order.status).toBe("pending");
    const free = await buy("b3", { eventId: event.id, tierId: "Free", quantity: 2 });
    expect(free.body.order.status).toBe("confirmed");
    expect(free.body.order.totalKip).toBe(0);
  });

  it("enforces stock atomically: the last ticket cannot be sold twice", async () => {
    const event = await createEvent(app, await as("org"), {
      tiers: [{ name: "Scarce", priceKip: 50000, quantityTotal: 2 }],
    });
    const tier = event.tiers[0].id;
    const results = await Promise.all([
      buy("r1", { eventId: event.id, tierId: tier, quantity: 1 }),
      buy("r2", { eventId: event.id, tierId: tier, quantity: 1 }),
      buy("r3", { eventId: event.id, tierId: tier, quantity: 1 }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 200, 409]);
    const [row] = await db.select().from(ticketTiers).where(eq(ticketTiers.id, tier));
    expect(row.quantitySold).toBe(2);
  });

  it("respects the per-order limit", async () => {
    const event = await createEvent(app, await as("org"), {
      tiers: [{ name: "Limited", priceKip: 1000, perOrderLimit: 2 }],
    });
    expect(
      (await buy("b4", { eventId: event.id, tierId: event.tiers[0].id, quantity: 3 })).status,
    ).toBe(422);
  });

  it("lists only the caller's own orders", async () => {
    const event = await createEvent(app, await as("org"));
    await buy("owner-of-order", { eventId: event.id, tierId: "Free", quantity: 1 });
    const mine = await request(app)
      .get("/api/tickets")
      .set(await as("owner-of-order"));
    const other = await request(app)
      .get("/api/tickets")
      .set(await as("someone-else"));
    expect(mine.body.tickets).toHaveLength(1);
    expect(mine.body.tickets[0].items).toHaveLength(1);
    expect(other.body.tickets).toHaveLength(0);
  });

  it("gives stock back when an unpaid order expires", async () => {
    const event = await createEvent(app, await as("org"), {
      tiers: [{ name: "Held", priceKip: 20000, quantityTotal: 1 }],
    });
    const tier = event.tiers[0].id;
    const first = await buy("h1", { eventId: event.id, tierId: tier, quantity: 1 });
    expect(first.status).toBe(200);
    expect((await buy("h2", { eventId: event.id, tierId: tier, quantity: 1 })).status).toBe(409);

    await db
      .update(orders)
      .set({ createdAt: sql`now() - interval '2 hours'` })
      .where(eq(orders.id, first.body.order.id));
    expect(await releaseExpiredOrders(30)).toBe(1);

    expect((await buy("h2", { eventId: event.id, tierId: tier, quantity: 1 })).status).toBe(200);
  });
});
