import { Router } from "express";
import { paymentService } from "../services/payment.service.ts";

const router = Router();

// 1. Payment Webhook Receiver (supports multiple endpoint paths from PhaJay/Telbiz/JDB/BCEL)
router.post(["/webhook/payment", "/payment/webhook"], (req, res) => {
  try {
    const payload = req.body || {};
    const result = paymentService.recordWebhook(payload);

    return res.json({
      success: true,
      message: "Payment webhook received and processed successfully",
      transactionId: result.txId,
      paid: result.isPaid,
    });
  } catch (error: any) {
    console.error("[Payment Route] Webhook Error:", error);
    return res.status(500).json({ error: "Failed to process payment webhook" });
  }
});

// 2. Transaction Status Verification Endpoint
router.get("/payment/status/:transactionId", async (req, res) => {
  const { transactionId } = req.params;
  if (!transactionId) {
    return res.status(400).json({ error: "Missing transactionId" });
  }

  try {
    const status = await paymentService.getPaymentStatus(transactionId);
    return res.json(status);
  } catch (error: any) {
    console.error("[Payment Route] Status Check Error:", error);
    return res.status(500).json({ error: "Failed to check transaction status" });
  }
});

export default router;
