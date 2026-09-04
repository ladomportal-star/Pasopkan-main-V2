import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import {
  createEventBody,
  eventIdParam,
  listEventsQuery,
  updateEventBody,
} from "../validators/event.validator.ts";
import { getEventById, getEvents, postEvent, putEvent } from "../controllers/event.controller.ts";

const router = Router();

router.get("/events", validate({ query: listEventsQuery }), getEvents);
router.get("/events/:id", validate({ params: eventIdParam }), getEventById);
router.post("/events", requireAuth, validate({ body: createEventBody }), postEvent);
router.put(
  "/events/:id",
  requireAuth,
  validate({ params: eventIdParam, body: updateEventBody }),
  putEvent,
);

export default router;
