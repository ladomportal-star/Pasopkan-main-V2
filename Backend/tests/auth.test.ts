/**
 * Auth behaviour with the dev bypass OFF — i.e. how production runs.
 * Env is set before importing the app so config/env.ts picks it up
 * (vitest isolates module state per test file).
 */
import { describe, it, expect } from "vitest";
import request from "supertest";

process.env.AUTH_DEV_BYPASS = "false";
process.env.FIREBASE_PROJECT_ID = "turnkey-envelope-jtn3v";

const { createApp } = await import("../src/app.ts");
const app = createApp();

describe("requireAuth without the dev bypass", () => {
  it("401s when the Authorization header is missing", async () => {
    const res = await request(app).get("/api/tickets");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/authorization header/i);
  });

  it("401s on a bearer token that is not a JWT", async () => {
    const res = await request(app).get("/api/tickets").set({ Authorization: "Bearer just-a-uid" });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });

  it("401s on a well-formed but forged JWT", async () => {
    const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const now = Math.floor(Date.now() / 1000);
    const forged = [
      b64({ alg: "RS256", kid: "x", typ: "JWT" }),
      b64({
        aud: "turnkey-envelope-jtn3v",
        iss: "https://securetoken.google.com/turnkey-envelope-jtn3v",
        sub: "attacker",
        user_id: "attacker",
        iat: now,
        exp: now + 3600,
      }),
      Buffer.from("forged-signature").toString("base64url"),
    ].join(".");

    const res = await request(app)
      .post("/api/checkins")
      .set({ Authorization: `Bearer ${forged}` })
      .send({
        ticketCode: "SHOULD-NOT-BE-RECORDED",
        eventId: "evt-1",
      });
    expect(res.status).toBe(401);
  });

  it("still serves public endpoints", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
  });
});
