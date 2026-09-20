import type { Request, Response } from "express";
import { ok, fail } from "../utils/response.util.ts";
import { getLatestNotifications } from "../services/notification.service.ts";

/** GET /api/notifications - Fetch the latest notifications from the server. */
export async function getNotifications(req: Request, res: Response) {
  try {
    const result = await getLatestNotifications();
    return ok(res, result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch notifications";
    return fail(res, message, 500);
  }
}
