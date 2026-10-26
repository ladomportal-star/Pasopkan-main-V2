import express, { Router } from "express";
import { receiveWebhook } from "../controllers/payment.controller.ts";
import { paymentService } from "../services/payment.service.ts";

// Keep this before express.json(): signature verification must use the exact
// bytes sent by the gateway, not a re-serialized object. Keep the body small.
const router = Router();
router.get(["/webhook/payment", "/payment/webhook"], (_req, res) => {
  res.json({
    ok: true,
    service: "Pasopkan PhaJay Webhook Endpoint",
    expectedMethod: "POST",
    ...paymentService.getReadiness(),
  });
});
router.post(
  ["/webhook/payment", "/payment/webhook"],
  express.raw({ type: "application/json", limit: "64kb" }),
  receiveWebhook,
);

export default router;
