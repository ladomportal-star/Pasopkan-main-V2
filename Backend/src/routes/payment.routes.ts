import { Router } from "express";
import { receiveWebhook, getPaymentStatus } from "../controllers/payment.controller.ts";

const router = Router();

// Webhook receiver — accepts both path spellings used by gateways
router.post(["/webhook/payment", "/payment/webhook"], receiveWebhook);
router.get("/payment/status/:transactionId", getPaymentStatus);

export default router;
