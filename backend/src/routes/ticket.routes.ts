import { Router } from "express";
import { requireAuth, requireRegisteredUser } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import {
  createTicketBody,
  refundTicketBody,
  refundTicketParams,
} from "../validators/ticket.validator.ts";
import {
  listTickets,
  createTicket,
  requestTicketRefund,
} from "../controllers/ticket.controller.ts";

const router = Router();
router.get("/tickets", requireAuth, listTickets);
router.post(
  "/tickets",
  requireAuth,
  requireRegisteredUser,
  validate({ body: createTicketBody }),
  createTicket,
);
router.post(
  "/tickets/:id/refund",
  requireAuth,
  requireRegisteredUser,
  validate({ params: refundTicketParams, body: refundTicketBody }),
  requestTicketRefund,
);
export default router;
