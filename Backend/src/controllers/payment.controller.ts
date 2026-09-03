import type { Request, Response } from "express";
import { ok, fail } from "../utils/response.util.ts";
import { paymentService } from "../services/payment.service.ts";
import { logger } from "../utils/logger.ts";

/** Webhook receiver (PhaJay / Telbiz / JDB / BCEL). */
export function receiveWebhook(req: Request, res: Response) {
  try {
    const result = paymentService.recordWebhook(req.body || {});
    return ok(res, {
      success: true,
      message: "Payment webhook received and processed successfully",
      transactionId: result.txId,
      paid: result.isPaid,
    });
  } catch (error: any) {
    logger.error("[payment.controller] webhook error:", error?.message);
    return fail(res, "Failed to process payment webhook", 500);
  }
}

/** Verify a transaction's status. */
export async function getPaymentStatus(req: Request, res: Response) {
  const { transactionId } = req.params;
  if (!transactionId) return fail(res, "Missing transactionId", 400);

  try {
    return ok(res, await paymentService.getPaymentStatus(transactionId));
  } catch (error: any) {
    logger.error("[payment.controller] status error:", error?.message);
    return fail(res, "Failed to check transaction status", 500);
  }
}
