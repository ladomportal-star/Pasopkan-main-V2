import type { Request, Response } from "express";
import { ok } from "../utils/response.util.ts";
import {
  getNotificationPreferences as loadPreferences,
  saveNotificationPreferences as persistPreferences,
} from "../services/notification-preference.service.ts";

export async function getNotificationPreferences(req: Request, res: Response) {
  return ok(res, { preferences: await loadPreferences(req.user!.uid) });
}

export async function saveNotificationPreferences(req: Request, res: Response) {
  return ok(res, { preferences: await persistPreferences(req.user!.uid, req.body) });
}
