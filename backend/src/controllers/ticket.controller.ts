import type { Request, Response } from "express";
import { ok, fail } from "../utils/response.util.ts";
import { createOrder, listOrders, requestOrderRefund } from "../services/ticket.service.ts";
import { getVerifiedPhone } from "../services/verified-phone.service.ts";
import { sendTransactionalSms } from "../services/sms-hook.service.ts";
import { logger } from "../utils/logger.ts";

/** GET /api/tickets — the current user's orders, each with its ticket items. */
export async function listTickets(req: Request, res: Response) {
  const uid = req.user?.uid;
  if (!uid) return fail(res, "Unauthorized", 401);
  return ok(res, { tickets: await listOrders(uid) });
}

/** POST /api/tickets/:id/refund — submit a refund request for a confirmed ticket order. */
export async function requestTicketRefund(req: Request, res: Response) {
  const uid = req.user?.uid;
  if (!uid) return fail(res, "Unauthorized", 401);
  const { order, refund } = await requestOrderRefund(uid, req.params.id, req.body?.reason);
  return ok(res, { success: true, order, refund });
}

/** POST /api/tickets — create an order + one ticket item per quantity.
 *  Body is validated by `validate(createTicketBody)`. */
export async function createTicket(req: Request, res: Response) {
  const uid = req.user?.uid;
  if (!uid) return fail(res, "Unauthorized", 401);

  const { order, items, organizerUid, checkout } = await createOrder({
    ...req.body,
    uid,
    email: req.user?.email,
  });

  if (organizerUid) {
    try {
      const phone = await getVerifiedPhone(organizerUid);
      if (phone)
        await sendTransactionalSms(
          phone,
          "Pasopkan: A new attendee ticket order was placed for your event.",
        );
    } catch {
      // The order and in-app organizer notification already committed. Do not
      // fail checkout or cause a duplicate order because SMS delivery is down.
      logger.warn({ orderId: order.id }, "Ticket order created but organizer SMS was unavailable");
    }
  }

  return ok(res, { success: true, order, items, checkout });
}
