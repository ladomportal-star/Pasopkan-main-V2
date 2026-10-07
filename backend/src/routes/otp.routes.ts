import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { sendOtp, verifyOtp } from "../controllers/otp.controller.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { sendOtpBody, verifyOtpBody } from "../validators/otp.validator.ts";

const router = Router();

const otpLimit = (limit: number) =>
  rateLimit({
    windowMs: 10 * 60 * 1000,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many OTP attempts. Please wait and try again" },
  });

router.post("/otp/send", otpLimit(5), validate({ body: sendOtpBody }), sendOtp);
router.post("/otp/verify", otpLimit(10), validate({ body: verifyOtpBody }), verifyOtp);

export default router;
