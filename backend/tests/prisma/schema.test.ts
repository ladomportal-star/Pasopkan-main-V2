import { test, after } from "node:test";
import assert from "node:assert/strict";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client.ts";

const url = process.env.PRISMA_TEST_DATABASE_URL;
if (!url || new URL(url).hostname !== "127.0.0.1")
  throw new Error("Run through scripts/test-prisma.mjs with its isolated cluster.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
after(() => db.$disconnect());

test("relational commerce persists and rejects orphan orders and duplicate identities", async () => {
  const user = await db.user.create({
    data: { authId: "schema-test", email: "schema@test.local" },
  });
  await assert.rejects(db.user.create({ data: { authId: user.authId } }));
  const organizer = await db.organizer.create({ data: { userId: user.id, name: "Host" } });
  const event = await db.event.create({ data: { title: "Show", organizerId: organizer.id } });
  const tier = await db.ticketTier.create({
    data: { eventId: event.id, name: "General", priceKip: 50000, quantityTotal: 1 },
  });
  const order = await db.order.create({
    data: {
      userId: user.id,
      eventId: event.id,
      eventTitle: event.title,
      orderNumber: "TEST-1",
      subtotalKip: 50000,
      totalKip: 50000,
      expiresAt: new Date(Date.now() + 900000),
      items: {
        create: {
          tierId: tier.id,
          tierName: tier.name,
          unitPriceKip: tier.priceKip,
          ticketCode: "CODE-1",
        },
      },
    },
    include: { items: true },
  });
  assert.equal(order.items.length, 1);
  await assert.rejects(db.event.delete({ where: { id: event.id } }));
  await assert.rejects(
    db.order.create({
      data: {
        userId: user.id,
        eventId: "00000000-0000-4000-8000-000000000000",
        eventTitle: "Missing",
        orderNumber: "ORPHAN",
        expiresAt: new Date(),
      },
    }),
  );
  const payment = await db.payment.create({
    data: { orderId: order.id, provider: "phajay", providerTransactionId: "TX1", amountKip: 50000 },
  });
  await assert.rejects(
    db.payment.create({
      data: {
        orderId: order.id,
        provider: "phajay",
        providerTransactionId: "TX1",
        amountKip: 50000,
      },
    }),
  );
  await db.payment.create({
    data: {
      orderId: order.id,
      provider: "another",
      providerTransactionId: "TX1",
      amountKip: 50000,
    },
  });
  const refund = await db.refund.create({
    data: { paymentId: payment.id, amountKip: 10000, reason: "Cancellation" },
  });
  assert.equal(refund.status, "pending_approval");
  await db.checkIn.create({ data: { orderItemId: order.items[0].id, checkedInByUserId: user.id } });
  await assert.rejects(
    db.checkIn.create({ data: { orderItemId: order.items[0].id, checkedInByUserId: user.id } }),
  );
});

test("money and inventory constraints reject invalid values", async () => {
  const event = await db.event.findFirstOrThrow();
  await assert.rejects(
    db.ticketTier.create({ data: { eventId: event.id, name: "Negative", priceKip: -1 } }),
  );
  await assert.rejects(
    db.ticketTier.create({
      data: { eventId: event.id, name: "Overbooked", quantityTotal: 1, quantitySold: 2 },
    }),
  );
});

test("audit records cannot be updated or deleted", async () => {
  const log = await db.auditLog.create({
    data: { action: "schema.test", entityType: "Test", entityId: "1" },
  });
  await assert.rejects(db.auditLog.update({ where: { id: log.id }, data: { action: "tampered" } }));
  await assert.rejects(db.auditLog.delete({ where: { id: log.id } }));
});
