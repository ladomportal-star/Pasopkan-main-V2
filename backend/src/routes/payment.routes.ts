import { Router } from "express";
import { requireAdmin, requireAuth } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { transactionIdParam } from "../validators/payment.validator.ts";
import { getPaymentStatus } from "../controllers/payment.controller.ts";
import { paymentService } from "../services/payment.service.ts";

const router = Router();

// Never return credential values. This is an operational readiness view only.
router.get("/admin/payment/readiness", requireAuth, requireAdmin, (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json(paymentService.getReadiness());
});

router.get(
  "/payment/status/:transactionId",
  requireAuth,
  validate({ params: transactionIdParam }),
  getPaymentStatus,
);

export default router;
