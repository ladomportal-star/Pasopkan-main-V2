import type { Request, Response } from "express";
import { ok, fail } from "../utils/response.util.ts";
import { paymentService } from "../services/payment.service.ts";
import { logger } from "../utils/logger.ts";

/** Webhook receiver (PhaJay / Telbiz / JDB / BCEL). */
export async function receiveWebhook(req: Request, res: Response) {
  try {
    const result = await paymentService.recordWebhook(req.body || {});
    return ok(res, {
      success: true,
      message: "Payment webhook received and processed successfully",
      transactionId: result.txId,
      paid: result.isPaid,
    });
  } catch (error: any) {
    logger.error({ err: error }, "payment webhook failed");
    return fail(res, "Failed to process payment webhook", 500);
  }
}

/** Verify a transaction's status. */
export async function getPaymentStatus(req: Request, res: Response) {
  try {
    return ok(res, await paymentService.getPaymentStatus(req.params.transactionId));
  } catch (error: any) {
    logger.error({ err: error }, "payment status check failed");
    return fail(res, "Failed to check transaction status", 500);
  }
}
