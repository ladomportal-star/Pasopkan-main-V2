import request from "supertest";
import type { Express } from "express";

/** Create an event through the real API as `owner` and return it. */
export async function createEvent(
  app: Express,
  owner: Record<string, string>,
  overrides: Record<string, unknown> = {},
) {
  const res = await request(app)
    .post("/api/events")
    .set(owner)
    .send({
      title: "That Luang Festival",
      status: "published",
      tiers: [
        { name: "General", priceKip: 100000, quantityTotal: 5 },
        { name: "Free", priceKip: 0 },
      ],
      ...overrides,
    });
  if (res.status !== 201)
    throw new Error(`seed event failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.event as {
    id: string;
    status: string;
    tiers: { id: string; name: string; priceKip: number; quantitySold: number }[];
  };
}
