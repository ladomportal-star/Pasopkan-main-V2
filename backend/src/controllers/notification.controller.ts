import type { Request, Response } from "express";
import { ok, fail } from "../utils/response.util.ts";
import {
  clearNotifications,
  deleteNotification,
  listNotifications,
  markAllRead,
  markRead,
} from "../services/notification.service.ts";

/** GET /api/notifications - the signed-in user's inbox (newest first) + unread count. */
export async function getNotifications(req: Request, res: Response) {
  const { unread, limit } = req.query as unknown as { unread?: boolean; limit: number };
  return ok(res, await listNotifications(req.user!.uid, { unreadOnly: unread, limit }));
}

/** PATCH /api/notifications/:id/read */
export async function readNotification(req: Request, res: Response) {
  return (await markRead(req.user!.uid, req.params.id))
    ? ok(res, { success: true })
    : fail(res, "Notification not found", 404);
}

/** POST /api/notifications/read-all */
export async function readAllNotifications(req: Request, res: Response) {
  return ok(res, { success: true, updated: await markAllRead(req.user!.uid) });
}

/** DELETE /api/notifications/:id */
export async function removeNotification(req: Request, res: Response) {
  return (await deleteNotification(req.user!.uid, req.params.id))
    ? ok(res, { success: true })
    : fail(res, "Notification not found", 404);
}

/** DELETE /api/notifications - clear the whole inbox. */
export async function removeAllNotifications(req: Request, res: Response) {
  return ok(res, { success: true, deleted: await clearNotifications(req.user!.uid) });
}
