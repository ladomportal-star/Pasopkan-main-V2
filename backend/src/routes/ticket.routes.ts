import { Router } from "express";
import { requireAuth, requireRegisteredUser } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { createTicketBody } from "../validators/ticket.validator.ts";
import { listTickets, createTicket } from "../controllers/ticket.controller.ts";

const router = Router();
router.get("/tickets", requireAuth, listTickets);
router.post(
  "/tickets",
  requireAuth,
  requireRegisteredUser,
  validate({ body: createTicketBody }),
  createTicket,
);
export default router;
