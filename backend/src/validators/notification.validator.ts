import { z } from "zod";

export const listNotificationsQuery = z.object({
  unread: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const notificationIdParam = z.object({ id: z.string().uuid() });

/** Admin-issued notification to another user (e.g. an event approval/rejection). */
export const createNotificationBody = z.object({
  userUid: z.string().min(1),
  type: z.enum(["upcomingEvent", "ticket", "promo", "verified", "system", "noted"]).optional(),
  title: z.string().min(1),
  titleLo: z.string().optional(),
  message: z.string().min(1),
  messageLo: z.string().optional(),
  data: z.record(z.string(), z.string()).optional(),
});
