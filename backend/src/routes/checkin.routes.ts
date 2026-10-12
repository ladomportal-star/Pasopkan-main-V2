import { Router } from "express";
import { requireAuth, requireRegisteredUser } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { createCheckinBody, listCheckinsQuery } from "../validators/checkin.validator.ts";
import { getCheckinLookup, getCheckins, postCheckin } from "../controllers/checkin.controller.ts";
import { listScannerEvents } from "../services/staff.service.ts";

const router = Router();

router.get("/checkins/events", requireAuth, requireRegisteredUser, async (req, res) => {
  res.json({ events: await listScannerEvents(req.user!.uid) });
});
router.get(
  "/checkins",
  requireAuth,
  requireRegisteredUser,
  validate({ query: listCheckinsQuery }),
  getCheckins,
);
router.get("/checkins/lookup/:code", requireAuth, requireRegisteredUser, getCheckinLookup);
router.post(
  "/checkins",
  requireAuth,
  requireRegisteredUser,
  validate({ body: createCheckinBody }),
  postCheckin,
);

export default router;
