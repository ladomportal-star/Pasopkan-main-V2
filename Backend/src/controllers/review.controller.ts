import type { Request, Response } from "express";
import { ok, fail } from "../utils/response.util.ts";
import { listReviewsByEvent, upsertReview } from "../services/review.service.ts";

/** GET /api/reviews/:eventId */
export async function listReviews(req: Request, res: Response) {
  return ok(res, { reviews: await listReviewsByEvent(req.params.eventId) });
}

/** POST /api/reviews — create or update the caller's review for an event.
 *  Body is validated by `validate(createReviewBody)`. */
export async function createReview(req: Request, res: Response) {
  const uid = req.user?.uid;
  if (!uid) return fail(res, "Unauthorized", 401);

  const review = await upsertReview({
    ...req.body,
    uid,
    email: req.user?.email || "user@example.com",
  });

  return ok(res, { success: true, review });
}
