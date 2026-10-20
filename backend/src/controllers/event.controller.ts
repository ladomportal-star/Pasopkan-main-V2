import type { Request, Response } from "express";
import { ok, fail } from "../utils/response.util.ts";
import { createEvent, getEvent, listEvents, updateEvent } from "../services/event.service.ts";
import { getVerifiedPhone } from "../services/verified-phone.service.ts";
import { sendTransactionalSms } from "../services/sms-hook.service.ts";
import { logger } from "../utils/logger.ts";

/** GET /api/events — account-only catalog; `?mine=true` lists the caller's own drafts too. */
export async function getEvents(req: Request, res: Response) {
  const { status, mine, limit, cursor } = req.query as unknown as {
    status?: string;
    mine?: boolean;
    limit: number;
    cursor?: string;
  };
  return ok(res, await listEvents({ status, mine, limit, cursor, viewerUid: req.user?.uid }));
}

/** GET /api/events/:id — by uuid, slug, or legacy id. */
export async function getEventById(req: Request, res: Response) {
  const event = await getEvent(req.params.id, req.user?.uid);
  return event ? ok(res, { event }) : fail(res, "Event not found", 404);
}

/** POST /api/events — create with nested tiers / zones / dates / coupons. */
export async function postEvent(req: Request, res: Response) {
  const event = await createEvent(req.body, req.user!.uid);
  let smsNotification: "accepted" | "unavailable" = "unavailable";
  if (req.body.status === "pending_review" && event) {
    try {
      const phone = await getVerifiedPhone(req.user!.uid);
      if (phone) {
        await sendTransactionalSms(
          phone,
          "Pasopkan: Your event was submitted successfully and is awaiting review.",
        );
        // Wenova accepted/queued the SMS; handset delivery is not guaranteed.
        smsNotification = "accepted";
      }
    } catch {
      // Event persistence has already committed. SMS failure must not report a
      // failed event submission or encourage the client to create a duplicate.
      logger.warn({ eventId: event.id }, "Event submitted but SMS notification was unavailable");
    }
  }
  return ok(res, { success: true, event, smsNotification }, 201);
}

/** PUT /api/events/:id — update columns; provided child arrays replace the set. Owner/admin only. */
export async function putEvent(req: Request, res: Response) {
  const event = await updateEvent(req.params.id, req.body, req.user!.uid);
  return event ? ok(res, { success: true, event }) : fail(res, "Event not found", 404);
}
