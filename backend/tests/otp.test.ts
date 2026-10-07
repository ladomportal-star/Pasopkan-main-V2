import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const signInWithOtp = vi.fn();
const verifyOtp = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { signInWithOtp, verifyOtp } }),
}));

process.env.SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
const { createApp } = await import("../src/app.ts");
const app = createApp();

describe("phone OTP authentication", () => {
  beforeEach(() => {
    signInWithOtp.mockReset();
    verifyOtp.mockReset();
  });

  it("normalizes a Lao mobile number and requests an OTP without exposing provider data", async () => {
    signInWithOtp.mockResolvedValue({ data: {}, error: null });

    const response = await request(app).post("/api/otp/send").send({ phone: "020 5555 5555" });

    expect(response.status).toBe(202);
    expect(response.body).toEqual({ success: true, cooldownSeconds: 60 });
    expect(signInWithOtp).toHaveBeenCalledWith({
      phone: "+8562055555555",
      options: { shouldCreateUser: true, captchaToken: undefined },
    });
  });

  it("rejects non-Lao and malformed mobile numbers before contacting Supabase", async () => {
    const response = await request(app).post("/api/otp/send").send({ phone: "+1 333 444 5555" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation failed");
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it("verifies the OTP and returns only the session fields needed by the browser", async () => {
    verifyOtp.mockResolvedValue({
      data: {
        session: {
          access_token: "access-token",
          refresh_token: "refresh-token",
          expires_in: 3600,
          provider_token: "must-not-leak",
        },
      },
      error: null,
    });

    const response = await request(app)
      .post("/api/otp/verify")
      .send({ phone: "+8562055555555", code: "123456" });

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body).toEqual({
      success: true,
      session: { accessToken: "access-token", refreshToken: "refresh-token", expiresIn: 3600 },
    });
    expect(verifyOtp).toHaveBeenCalledWith({
      phone: "+8562055555555",
      token: "123456",
      type: "sms",
    });
  });

  it("returns a generic error for an invalid or expired OTP", async () => {
    verifyOtp.mockResolvedValue({ data: { session: null }, error: { status: 403 } });

    const response = await request(app)
      .post("/api/otp/verify")
      .send({ phone: "02055555555", code: "000000" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid or expired verification code" });
  });
});
