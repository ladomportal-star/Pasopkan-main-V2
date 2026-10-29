import { Router } from "express";
import { requireAuth, requireRegisteredUser } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { listOrganizerAttendees } from "../services/organizer.service.ts";
import { organizerAttendeesParams, organizerAttendeesQuery } from "../validators/organizer.validator.ts";

const router = Router();

router.get(
  "/organizer/events/:eventId/attendees",
  requireAuth,
  requireRegisteredUser,
  validate({ params: organizerAttendeesParams, query: organizerAttendeesQuery }),
  async (req, res) => {
    const query = organizerAttendeesQuery.parse(req.query);
    const data = await listOrganizerAttendees(req.params.eventId, req.user!.uid, query);
    res.json(data);
  },
);

export default router;
