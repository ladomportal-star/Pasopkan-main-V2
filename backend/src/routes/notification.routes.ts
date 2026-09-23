import { Router } from "express";
import { getNotifications, createNotification } from "../controllers/notification.controller.ts";

const router = Router();

router.get("/notifications", getNotifications);
router.post("/notifications", createNotification);

export default router;

