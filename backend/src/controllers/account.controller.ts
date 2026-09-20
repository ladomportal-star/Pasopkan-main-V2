import type { Request, Response } from "express";
import { ok, fail } from "../utils/response.util.ts";
import { upsertUserProfile } from "../services/user.service.ts";
import { logger } from "../utils/logger.ts";

/** Sync the authenticated user's profile into the database.
 *  Body is validated by `validate(syncAccountBody)`. */
export async function syncAccount(req: Request, res: Response) {
  const uid = req.user?.uid;
  if (!uid) return fail(res, "Unauthorized", 401);

  try {
    const user = await upsertUserProfile(uid, req.body);
    return ok(res, { success: true, user });
  } catch (error: any) {
    logger.error({ err: error }, "account sync failed");
    return fail(res, error?.message || "Failed to synchronize user account", 500);
  }
}
