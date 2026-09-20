import type { Request, Response } from "express";
import { ok } from "../utils/response.util.ts";
import { upsertUserProfile } from "../services/user.service.ts";

/** Sync the authenticated user's profile into the database.
 *  Body is validated by `validate(syncAccountBody)`. */
export async function syncAccount(req: Request, res: Response) {
  const user = await upsertUserProfile(req.user!.uid, {
    ...req.body,
    email: req.body.email || req.user!.email,
  });
  return ok(res, { success: true, user });
}
