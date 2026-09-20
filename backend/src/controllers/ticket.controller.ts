import type { Request, Response } from "express";
import { ok, fail } from "../utils/response.util.ts";
import { createOrder, listOrders } from "../services/ticket.service.ts";

/** GET /api/tickets — the current user's orders, each with its ticket items. */
export async function listTickets(req: Request, res: Response) {
  const uid = req.user?.uid;
  if (!uid) return fail(res, "Unauthorized", 401);
  return ok(res, { tickets: await listOrders(uid) });
}

/** POST /api/tickets — create an order + one ticket item per quantity.
 *  Body is validated by `validate(createTicketBody)`. */
export async function createTicket(req: Request, res: Response) {
  const uid = req.user?.uid;
  if (!uid) return fail(res, "Unauthorized", 401);

  const { order, items } = await createOrder({
    ...req.body,
    uid,
    email: req.user?.email || "user@example.com",
  });

  return ok(res, { success: true, order, items });
}
