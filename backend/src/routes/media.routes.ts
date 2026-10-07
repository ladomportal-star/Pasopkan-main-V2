import { Router } from "express";
import { z } from "zod";
import {
  requireAuth,
  requireRegisteredUser,
  optionalAuth,
} from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { uploadImage, resolveImage } from "../services/media.service.ts";
const router = Router();
router.post(
  "/media",
  requireAuth,
  requireRegisteredUser,
  validate({
    body: z.object({
      dataUrl: z.string().max(7 * 1024 * 1024),
      visibility: z.enum(["public", "private"]),
    }),
  }),
  async (req, res) => {
    res
      .status(201)
      .json({ reference: await uploadImage(req.user!.uid, req.body.dataUrl, req.body.visibility) });
  },
);
router.get(
  "/media/url",
  optionalAuth,
  validate({ query: z.object({ reference: z.string().max(500) }) }),
  async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({ url: await resolveImage(req.user?.uid, String(req.query.reference)) });
  },
);
export default router;
