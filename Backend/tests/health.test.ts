import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.ts";

const app = createApp();

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok", app: "Pasopkan API" });
  });
});

describe("unknown routes", () => {
  it("404s unknown /api paths", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
  });
});
