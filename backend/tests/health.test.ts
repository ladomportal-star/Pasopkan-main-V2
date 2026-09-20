import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.ts";

describe("GET /api/health", () => {
  it("reports the database as connected (real query)", async () => {
    const res = await request(createApp()).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok", database: "connected" });
  });
});
