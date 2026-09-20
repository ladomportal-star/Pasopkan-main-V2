import { Router } from "express";
import { getNotifications } from "../controllers/notification.controller.ts";

const router = Router();

router.get("/notifications", getNotifications);

export default router;
