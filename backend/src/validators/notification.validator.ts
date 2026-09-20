import { z } from "zod";

export const listNotificationsQuery = z.object({
  unread: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const notificationIdParam = z.object({ id: z.string().uuid() });
