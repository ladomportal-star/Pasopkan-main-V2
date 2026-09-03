import type { Request, Response } from "express";
import { ok, fail } from "../utils/response.util.ts";
import { createOrder, listOrders } from "../services/ticket.service.ts";

/** GET /api/tickets — the current user's orders, each with its ticket items. */
export async function listTickets(req: Request, res: Response) {
  const uid = req.user?.uid;
  if (!uid) return fail(res, "Unauthorized", 400);
  return ok(res, { tickets: await listOrders(uid) });
}

/** POST /api/tickets — create an order + one ticket item per quantity. */
export async function createTicket(req: Request, res: Response) {
  const uid = req.user?.uid;
  if (!uid) return fail(res, "Unauthorized", 400);

  const { eventId, eventTitle, tierId, tierName, price, quantity, selectedDate, selectedTime } =
    req.body ?? {};
  if (!eventId || !eventTitle || !tierId || !tierName || quantity === undefined) {
    return fail(res, "Missing required booking details", 400);
  }

  const { order, items } = await createOrder({
    uid,
    email: req.user?.email || "user@example.com",
    eventId,
    eventTitle,
    tierId,
    tierName,
    price,
    quantity,
    selectedDate,
    selectedTime,
  });

  return ok(res, { success: true, order, items });
}
