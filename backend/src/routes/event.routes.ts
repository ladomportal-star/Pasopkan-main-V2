import { Router } from "express";
import {
  optionalAuth,
  requireAuth,
  requireRegisteredUser,
} from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import {
  createEventBody,
  eventIdParam,
  listEventsQuery,
  updateEventBody,
} from "../validators/event.validator.ts";
import { getEventById, getEvents, postEvent, putEvent } from "../controllers/event.controller.ts";

const router = Router();

router.get("/events", optionalAuth, validate({ query: listEventsQuery }), getEvents);
router.get("/events/:id", optionalAuth, validate({ params: eventIdParam }), getEventById);
router.post(
  "/events",
  requireAuth,
  requireRegisteredUser,
  validate({ body: createEventBody }),
  postEvent,
);
router.put(
  "/events/:id",
  requireAuth,
  requireRegisteredUser,
  validate({ params: eventIdParam, body: updateEventBody }),
  putEvent,
);

export default router;
