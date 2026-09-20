import type { Request, Response } from "express";
import { ok, fail } from "../utils/response.util.ts";
import { createEvent, getEvent, listEvents, updateEvent } from "../services/event.service.ts";

/** GET /api/events — public catalog; `?mine=true` (signed in) lists the caller's own, drafts included. */
export async function getEvents(req: Request, res: Response) {
  const { status, mine, limit } = req.query as unknown as {
    status?: string;
    mine?: boolean;
    limit: number;
  };
  return ok(res, { events: await listEvents({ status, mine, limit, viewerUid: req.user?.uid }) });
}

/** GET /api/events/:id — by uuid, slug, or legacy id. */
export async function getEventById(req: Request, res: Response) {
  const event = await getEvent(req.params.id, req.user?.uid);
  return event ? ok(res, { event }) : fail(res, "Event not found", 404);
}

/** POST /api/events — create with nested tiers / zones / dates / coupons. */
export async function postEvent(req: Request, res: Response) {
  const event = await createEvent(req.body, req.user!.uid);
  return ok(res, { success: true, event }, 201);
}

/** PUT /api/events/:id — update columns; provided child arrays replace the set. Owner/admin only. */
export async function putEvent(req: Request, res: Response) {
  const event = await updateEvent(req.params.id, req.body, req.user!.uid);
  return event ? ok(res, { success: true, event }) : fail(res, "Event not found", 404);
}
