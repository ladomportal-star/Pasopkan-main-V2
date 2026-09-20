import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { syncAccountBody } from "../validators/account.validator.ts";
import { syncAccount } from "../controllers/account.controller.ts";

const router = Router();
router.post("/account/sync", requireAuth, validate({ body: syncAccountBody }), syncAccount);
export default router;
