import type { Request, Response } from "express";
import { sendPhoneOtp, verifyPhoneOtp } from "../services/otp.service.ts";
import { ok } from "../utils/response.util.ts";

export async function sendOtp(req: Request, res: Response) {
  await sendPhoneOtp(req.body.phone, req.body.captchaToken);
  return ok(res, { success: true, cooldownSeconds: 60 }, 202);
}

export async function verifyOtp(req: Request, res: Response) {
  const session = await verifyPhoneOtp(req.body.phone, req.body.code);
  res.setHeader("Cache-Control", "no-store");
  return ok(res, { success: true, session });
}
