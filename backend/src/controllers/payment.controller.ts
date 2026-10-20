import type { Request, Response } from "express";
import { ok } from "../utils/response.util.ts";
import { paymentService } from "../services/payment.service.ts";
import { HttpError } from "../middlewares/error.middleware.ts";

/** Webhook receiver. Provider-specific signature verification is required. */
export async function receiveWebhook(req: Request, res: Response) {
  if (!Buffer.isBuffer(req.body))
    throw new HttpError(400, "Expected an application/json webhook body");
  const result = await paymentService.recordWebhook(req.body, req.headers);
  return ok(res, {
    success: true,
    message: "Payment webhook received and processed successfully",
    transactionId: result.txId,
    paid: result.isPaid,
  });
}

/** Verify a transaction's status. */
export async function getPaymentStatus(req: Request, res: Response) {
  return ok(res, await paymentService.getPaymentStatus(req.params.transactionId, req.user!.uid));
}
