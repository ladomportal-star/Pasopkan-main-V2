import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.ts";
import { as } from "./helpers/auth.ts";

const app = createApp();
const review = (user: string, body: Record<string, unknown>) =>
  as(user).then((h) => request(app).post("/api/reviews").set(h).send(body));

describe("reviews", () => {
  it("requires sign-in and a valid body", async () => {
    expect((await request(app).post("/api/reviews").send({})).status).toBe(401);
    expect((await review("r1", { eventId: "e1" })).status).toBe(400);
  });

  it("is empty until someone actually reviews", async () => {
    const res = await request(app).get("/api/reviews/never-reviewed");
    expect(res.body).toEqual({ reviews: [] });
  });

  it("creates a review, then updates the same user's review instead of duplicating it", async () => {
    const first = await review("r1", {
      eventId: "e-1",
      rating: 4,
      comment: "Great",
      userName: "Ana",
    });
    expect(first.status).toBe(200);

    await review("r1", { eventId: "e-1", rating: 5, comment: "Even better", userName: "Ana" });
    await review("r2", { eventId: "e-1", rating: 3, comment: "Fine", userName: "Bo" });

    const list = await request(app).get("/api/reviews/e-1");
    expect(list.body.reviews).toHaveLength(2);
    const ana = list.body.reviews.find((r: { userName: string }) => r.userName === "Ana");
    expect(ana).toMatchObject({ rating: 5, comment: "Even better" });
  });
});
