import type { Request, Response } from "express";
import { ok, fail } from "../utils/response.util.ts";
import { getOrCreateUser } from "../services/user.service.ts";
import { logger } from "../utils/logger.ts";

/** Sync the authenticated user's profile into the database. */
export async function syncAccount(req: Request, res: Response) {
  try {
    const { email } = req.body ?? {};
    const uid = req.user?.uid;
    if (!uid || !email) return fail(res, "Missing uid or email", 400);

    const user = await getOrCreateUser(uid, email);
    return ok(res, { success: true, user });
  } catch (error: any) {
    logger.error("[account.controller] sync error:", error?.message);
    return fail(res, error?.message || "Failed to synchronize user account", 500);
  }
}
