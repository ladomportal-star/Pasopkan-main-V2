import type { Request, Response } from "express";
import { ok } from "../utils/response.util.ts";
import { paymentService } from "../services/payment.service.ts";

/** Webhook receiver (PhaJay / Telbiz / JDB / BCEL). A failure answers 5xx so the gateway retries. */
export async function receiveWebhook(req: Request, res: Response) {
  const result = await paymentService.recordWebhook(req.body || {});
  return ok(res, {
    success: true,
    message: "Payment webhook received and processed successfully",
    transactionId: result.txId,
    paid: result.isPaid,
  });
}

/** Verify a transaction's status. */
export async function getPaymentStatus(req: Request, res: Response) {
  return ok(res, await paymentService.getPaymentStatus(req.params.transactionId));
}
