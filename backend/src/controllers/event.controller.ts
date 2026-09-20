import type { Request, Response } from "express";
import { ok, fail } from "../utils/response.util.ts";
import { createEvent, getEvent, listEvents, updateEvent } from "../services/event.service.ts";

/** GET /api/events — catalog list (optionally filtered). */
export async function getEvents(req: Request, res: Response) {
  return ok(res, { events: await listEvents(req.query as any) });
}

/** GET /api/events/:id — by uuid, slug, or legacy id. */
export async function getEventById(req: Request, res: Response) {
  const event = await getEvent(req.params.id);
  return event ? ok(res, { event }) : fail(res, "Event not found", 404);
}

/** POST /api/events — create with nested tiers / zones / dates / coupons. */
export async function postEvent(req: Request, res: Response) {
  const uid = req.user?.uid;
  if (!uid) return fail(res, "Unauthorized", 401);
  const event = await createEvent(req.body, uid);
  return ok(res, { success: true, event }, 201);
}

/** PUT /api/events/:id — update columns; provided child arrays replace the set. */
export async function putEvent(req: Request, res: Response) {
  const uid = req.user?.uid;
  if (!uid) return fail(res, "Unauthorized", 401);
  const event = await updateEvent(req.params.id, req.body);
  return event ? ok(res, { success: true, event }) : fail(res, "Event not found", 404);
}
