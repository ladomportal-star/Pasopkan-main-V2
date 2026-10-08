import { afterEach, describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.ts";
import { pool } from "../src/config/database.ts";

describe("GET /api/health", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports the database as connected (real query)", async () => {
    const res = await request(createApp()).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok", database: "connected" });
  });

  it("returns 503 when the database is unavailable", async () => {
    vi.spyOn(pool, "query").mockRejectedValueOnce(new Error("database unavailable"));

    const res = await request(createApp()).get("/api/health");

    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({
      status: "unavailable",
      database: "disconnected",
    });
  });
});
