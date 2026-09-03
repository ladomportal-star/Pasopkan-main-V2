import type { Request, Response } from "express";
import { ok, fail } from "../utils/response.util.ts";
import { listReviewsByEvent, upsertReview } from "../services/review.service.ts";

/** GET /api/reviews/:eventId */
export async function listReviews(req: Request, res: Response) {
  const list = await listReviewsByEvent(req.params.eventId);
  return ok(res, { reviews: list });
}

/** POST /api/reviews — create or update the caller's review for an event. */
export async function createReview(req: Request, res: Response) {
  const uid = req.user?.uid;
  if (!uid) return fail(res, "Unauthorized", 400);

  const { eventId, userName, userRealName, rating, comment, date, avatarUrl } = req.body ?? {};
  if (!eventId || rating === undefined || !comment) {
    return fail(res, "Missing required review fields", 400);
  }

  const review = await upsertReview({
    uid,
    email: req.user?.email || "user@example.com",
    eventId,
    userName,
    userRealName,
    rating,
    comment,
    date,
    avatarUrl,
  });

  return ok(res, { success: true, review });
}
