import { Router } from "express";
import { env } from "../config/env.ts";

const otpRouter = Router();

const configured = () => Boolean(env.otp.apiKey && env.otp.senderId && env.otp.templateId);
const notConfigured = { error: "OTP service is not configured on the server" };

otpRouter.post("/otp/send", async (req, res) => {
  if (!configured()) return res.status(503).json(notConfigured);
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "Phone number required" });
  }

  try {
    const response = await fetch("https://api.otp.dev/v1/verifications", {
      method: "POST",
      headers: {
        "X-OTP-Key": env.otp.apiKey,
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        data: {
          channel: "sms",
          sender: env.otp.senderId,
          phone: phone,
          template: env.otp.templateId,
          code_length: 6,
        },
      }),
    });

    const data = (await response.json()) as any;
    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: data.message || "Failed to send OTP", details: data });
    }

    res.json(data);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "OTP request failed" });
  }
});

otpRouter.post("/otp/verify", async (req, res) => {
  if (!configured()) return res.status(503).json(notConfigured);
  const { phone, code } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Code required" });
  }

  try {
    // Pass phone just in case it's required for some platforms (optional but good practice)
    const url = new URL("https://api.otp.dev/v1/verifications");
    url.searchParams.append("code", code);
    if (phone) url.searchParams.append("phone", phone);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-OTP-Key": env.otp.apiKey,
        accept: "application/json",
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      return res.status(400).json({ error: "Invalid OTP", success: false, details: data });
    }

    const data = await response.json().catch(() => null);
    // Usually if empty body but 200 OK, it could be valid or invalid depending on api.otp.dev.
    // The documentation says: "If the data returned is empty, it indicates an invalid code"
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return res.status(400).json({ error: "Invalid OTP", success: false });
    }

    res.json({ success: true, data });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : "OTP request failed" });
  }
});

export default otpRouter;
