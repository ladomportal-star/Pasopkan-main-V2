import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.ts";
import { as, tokenFor } from "./helpers/auth.ts";

const app = createApp();

describe("authentication (real JWT verification, nothing bypassed)", () => {
  it("401s without a bearer token", async () => {
    expect((await request(app).get("/api/tickets")).status).toBe(401);
  });

  it("401s for a bare uid used as the token (the old dev shortcut)", async () => {
    const res = await request(app).get("/api/tickets").set({ Authorization: "Bearer just-a-uid" });
    expect(res.status).toBe(401);
  });

  it("401s for the old mock_* tokens", async () => {
    for (const t of ["mock_token_12345", "dev_someone", "pasopkan_mock_x"]) {
      const res = await request(app).get("/api/tickets").set({ Authorization: `Bearer ${t}` });
      expect(res.status).toBe(401);
    }
  });

  it("401s for an unsigned/forged token whose payload looks valid", async () => {
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const forged = `${b64({ alg: "none" })}.${b64({ sub: "victim", aud: "authenticated" })}.`;
    const res = await request(app).get("/api/tickets").set({ Authorization: `Bearer ${forged}` });
    expect(res.status).toBe(401);
  });

  it("401s when signed by a key the identity provider doesn't publish", async () => {
    const res = await request(app).get("/api/tickets").set(await as("u1", { wrongKey: true }));
    expect(res.status).toBe(401);
  });

  it("401s for an expired token", async () => {
    const token = await tokenFor("u1", { expiresIn: "-1h" });
    const res = await request(app).get("/api/tickets").set({ Authorization: `Bearer ${token}` });
    expect(res.status).toBe(401);
  });

  it("401s for a token from another issuer or audience", async () => {
    expect(
      (await request(app).get("/api/tickets").set(await as("u1", { issuer: "https://evil.example/auth/v1" }))).status,
    ).toBe(401);
    expect((await request(app).get("/api/tickets").set(await as("u1", { audience: "anon" }))).status).toBe(401);
  });

  it("accepts a valid token", async () => {
    const res = await request(app).get("/api/tickets").set(await as("u1"));
    expect(res.status).toBe(200);
    expect(res.body.tickets).toEqual([]);
  });

  it("guest (anonymous) sessions may browse but cannot create events", async () => {
    const guest = await as("guest-1", { anonymous: true });
    expect((await request(app).get("/api/events").set(guest)).status).toBe(200);
    expect((await request(app).post("/api/events").set(guest).send({ title: "x" })).status).toBe(403);
  });

  it("answers 503 (not a silent pass) when auth is not configured", async () => {
    const saved = process.env.SUPABASE_URL;
    process.env.SUPABASE_URL = "";
    vi.resetModules();
    const { createApp: freshApp } = await import("../src/app.ts");
    const res = await request(freshApp()).get("/api/tickets").set({ Authorization: "Bearer anything" });
    process.env.SUPABASE_URL = saved;
    expect(res.status).toBe(503);
  });
});
