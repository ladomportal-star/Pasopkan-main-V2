import type { Request, Response } from "express";
import { ok, fail } from "../utils/response.util.ts";
import { listCheckins, lookupTicket, scanTicket } from "../services/checkin.service.ts";

/** POST /api/checkins — record a gate scan of a ticket code. */
export async function postCheckin(req: Request, res: Response) {
  const staff = req.user!.uid;
  const result = await scanTicket(req.body, staff);
  return ok(res, { success: true, ...result }, result.status === "checked_in" ? 201 : 200);
}

/** GET /api/checkins?eventId=... — every check-in for an event. */
export async function getCheckins(req: Request, res: Response) {
  const eventId = String(req.query.eventId ?? "");
  if (!eventId) return fail(res, "eventId is required", 400);
  return ok(res, { checkIns: await listCheckins(eventId, req.user!.uid) });
}

/** GET /api/checkins/lookup/:code — preview a scanned ticket without checking it in. */
export async function getCheckinLookup(req: Request, res: Response) {
  const ticket = await lookupTicket(req.params.code, req.user!.uid);
  return ticket ? ok(res, { ticket }) : fail(res, "Ticket not found", 404);
}
