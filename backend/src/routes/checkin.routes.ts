import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { createCheckinBody, listCheckinsQuery } from "../validators/checkin.validator.ts";
import { getCheckinLookup, getCheckins, postCheckin } from "../controllers/checkin.controller.ts";

const router = Router();

router.get("/checkins", requireAuth, validate({ query: listCheckinsQuery }), getCheckins);
router.get("/checkins/lookup/:code", requireAuth, getCheckinLookup);
router.post("/checkins", requireAuth, validate({ body: createCheckinBody }), postCheckin);

export default router;
