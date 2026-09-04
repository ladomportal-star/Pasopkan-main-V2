import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.ts";
import { transactionIdParam } from "../validators/payment.validator.ts";
import { receiveWebhook, getPaymentStatus } from "../controllers/payment.controller.ts";

const router = Router();

// Webhook receiver — accepts both path spellings used by gateways
router.post(["/webhook/payment", "/payment/webhook"], receiveWebhook);
router.get(
  "/payment/status/:transactionId",
  validate({ params: transactionIdParam }),
  getPaymentStatus,
);

export default router;
