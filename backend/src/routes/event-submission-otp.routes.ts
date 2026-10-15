import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { requireAuth, requireRegisteredUser } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { issueEventSubmissionOtp } from "../services/event-submission-otp.service.ts";

const router = Router();
router.post(
  "/organizer/event-submission-otp",
  requireAuth,
  requireRegisteredUser,
  rateLimit({ windowMs: 10 * 60_000, limit: 8, standardHeaders: "draft-7", legacyHeaders: false }),
  validate({ body: z.object({ phone: z.string().trim().min(1).max(32) }) }),
  async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await issueEventSubmissionOtp(req.user!.uid, req.body.phone));
  },
);
export default router;
