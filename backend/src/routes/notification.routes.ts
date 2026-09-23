import { Router } from "express";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import {
  createNotificationBody,
  listNotificationsQuery,
  notificationIdParam,
} from "../validators/notification.validator.ts";
import {
  createNotification,
  getNotifications,
  readAllNotifications,
  readNotification,
  removeAllNotifications,
  removeNotification,
} from "../controllers/notification.controller.ts";

const router = Router();

router.use("/notifications", requireAuth);

router.get("/notifications", validate({ query: listNotificationsQuery }), getNotifications);
router.post(
  "/notifications",
  requireAdmin,
  validate({ body: createNotificationBody }),
  createNotification,
);
router.post("/notifications/read-all", readAllNotifications);
router.patch(
  "/notifications/:id/read",
  validate({ params: notificationIdParam }),
  readNotification,
);
router.delete("/notifications/:id", validate({ params: notificationIdParam }), removeNotification);
router.delete("/notifications", removeAllNotifications);

export default router;

