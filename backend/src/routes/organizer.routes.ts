import { Router } from "express";
import { requireAuth, requireRegisteredUser } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import {
  createOrganizerWalkinBooking,
  getBookingDayOverrides,
  getOrganizerAnalytics,
  getOrganizerPayoutBill,
  getOrganizerPayoutsAndBank,
  listOrganizerAttendees,
  rescheduleOrganizerBooking,
  saveBookingDayOverrides,
  updateOrganizerBankDetails,
} from "../services/organizer.service.ts";
import {
  bookingOverridesBody,
  createWalkinBody,
  organizerAttendeeItemParams,
  organizerAttendeesParams,
  organizerAttendeesQuery,
  organizerBankDetailsBody,
  rescheduleAttendeeBody,
} from "../validators/organizer.validator.ts";

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

router.patch(
  "/organizer/events/:eventId/attendees/:itemId/schedule",
  requireAuth,
  requireRegisteredUser,
  validate({ params: organizerAttendeeItemParams, body: rescheduleAttendeeBody }),
  async (req, res) => {
    const body = rescheduleAttendeeBody.parse(req.body);
    const data = await rescheduleOrganizerBooking(
      req.params.eventId,
      req.params.itemId,
      req.user!.uid,
      body,
    );
    res.json(data);
  },
);

router.post(
  "/organizer/events/:eventId/walkin",
  requireAuth,
  requireRegisteredUser,
  validate({ params: organizerAttendeesParams, body: createWalkinBody }),
  async (req, res) => {
    const body = createWalkinBody.parse(req.body);
    const data = await createOrganizerWalkinBooking(req.params.eventId, req.user!.uid, body);
    res.status(201).json(data);
  },
);

router.get(
  "/organizer/events/:eventId/booking-overrides",
  requireAuth,
  requireRegisteredUser,
  validate({ params: organizerAttendeesParams }),
  async (req, res) => {
    const data = await getBookingDayOverrides(req.params.eventId, req.user!.uid);
    res.json(data);
  },
);

router.put(
  "/organizer/events/:eventId/booking-overrides",
  requireAuth,
  requireRegisteredUser,
  validate({ params: organizerAttendeesParams, body: bookingOverridesBody }),
  async (req, res) => {
    const body = bookingOverridesBody.parse(req.body);
    const data = await saveBookingDayOverrides(req.params.eventId, req.user!.uid, body.overrides);
    res.json(data);
  },
);

router.get(
  "/organizer/payouts",
  requireAuth,
  requireRegisteredUser,
  async (req, res) => {
    const data = await getOrganizerPayoutsAndBank(req.user!.uid);
    res.json(data);
  },
);

router.get(
  "/organizer/payouts/:eventId/bill",
  requireAuth,
  requireRegisteredUser,
  validate({ params: organizerAttendeesParams }),
  async (req, res) => {
    const url = await getOrganizerPayoutBill(req.user!.uid, req.params.eventId);
    res.json({ url });
  },
);

router.put(
  "/organizer/bank-details",
  requireAuth,
  requireRegisteredUser,
  validate({ body: organizerBankDetailsBody }),
  async (req, res) => {
    const body = organizerBankDetailsBody.parse(req.body);
    const data = await updateOrganizerBankDetails(req.user!.uid, body);
    res.json(data);
  },
);

router.get(
  "/organizer/analytics",
  requireAuth,
  requireRegisteredUser,
  async (req, res) => {
    const data = await getOrganizerAnalytics(req.user!.uid);
    res.json(data);
  },
);

export default router;
