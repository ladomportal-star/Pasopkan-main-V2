import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.ts";
import { listReviews, createReview } from "../controllers/review.controller.ts";

const router = Router();
router.get("/reviews/:eventId", listReviews);
router.post("/reviews", requireAuth, createReview);
export default router;
