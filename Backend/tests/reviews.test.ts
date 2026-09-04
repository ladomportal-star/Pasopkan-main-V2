import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.ts";

const app = createApp();
const auth = { Authorization: "Bearer reviewer-uid" };

describe("reviews", () => {
  it("400s on a missing rating", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .set(auth)
      .send({ eventId: "1", comment: "great" });
    expect(res.status).toBe(400);
  });

  it("creates then lists a review (in-memory fallback)", async () => {
    const create = await request(app)
      .post("/api/reviews")
      .set(auth)
      .send({ eventId: "evt-test", userName: "Somchai", rating: 5, comment: "Amazing!" });
    expect(create.status).toBe(200);
    expect(create.body.review.rating).toBe(5);

    const list = await request(app).get("/api/reviews/evt-test");
    expect(list.status).toBe(200);
    expect(list.body.reviews.some((r: any) => r.userName === "Somchai")).toBe(true);
  });

  it("updates the same author's review instead of duplicating", async () => {
    await request(app)
      .post("/api/reviews")
      .set(auth)
      .send({ eventId: "evt-dup", userName: "A", rating: 3, comment: "ok" });
    await request(app)
      .post("/api/reviews")
      .set(auth)
      .send({ eventId: "evt-dup", userName: "A", rating: 4, comment: "better" });

    const list = await request(app).get("/api/reviews/evt-dup");
    expect(list.body.reviews).toHaveLength(1);
    expect(list.body.reviews[0].rating).toBe(4);
  });
});
