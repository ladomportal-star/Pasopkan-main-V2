import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { createReviewBody, eventIdParam } from "../validators/review.validator.ts";
import { listReviews, createReview } from "../controllers/review.controller.ts";

const router = Router();
router.get("/reviews/:eventId", validate({ params: eventIdParam }), listReviews);
router.post("/reviews", requireAuth, validate({ body: createReviewBody }), createReview);
export default router;
