import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.ts";
import { listTickets, createTicket } from "../controllers/ticket.controller.ts";

const router = Router();
router.get("/tickets", requireAuth, listTickets);
router.post("/tickets", requireAuth, createTicket);
export default router;
