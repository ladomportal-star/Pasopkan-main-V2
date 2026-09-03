import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.ts";
import { syncAccount } from "../controllers/account.controller.ts";

const router = Router();
router.post("/account/sync", requireAuth, syncAccount);
export default router;
