import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import {
  listPayouts,
  updatePayoutFee,
  attachPayoutBill,
  getPayoutBillUrl,
} from "../services/payout.service.ts";
import { paymentService } from "../services/payment.service.ts";

const router = Router();
const eventParams = z.object({ eventId: z.string().uuid() });

router.get("/admin/payouts/readiness", requireAuth, requireAdmin, (_req, res) => {
  res.setHeader("Cache-Control", "private, no-store");
  res.json(paymentService.getReadiness().payout);
});

router.get("/admin/payouts", requireAuth, requireAdmin, async (_req, res) => {
  res.setHeader("Cache-Control", "private, no-store");
  res.json({ payouts: await listPayouts() });
});

router.patch(
  "/admin/payouts/:eventId",
  requireAuth,
  requireAdmin,
  validate({
    params: eventParams,
    body: z.object({ feePercent: z.number().int().min(0).max(100) }),
  }),
  async (req, res) => {
    await updatePayoutFee(req.user!.uid, req.params.eventId, req.body.feePercent);
    res.setHeader("Cache-Control", "private, no-store");
    res.json({ success: true });
  },
);

router.post(
  "/admin/payouts/:eventId/bill",
  requireAuth,
  requireAdmin,
  validate({
    params: eventParams,
    body: z.object({ dataUrl: z.string().max(7 * 1024 * 1024) }),
  }),
  async (req, res) => {
    await attachPayoutBill(req.user!.uid, req.params.eventId, req.body.dataUrl);
    res.setHeader("Cache-Control", "private, no-store");
    res.status(201).json({ success: true });
  },
);

router.get(
  "/admin/payouts/:eventId/bill",
  requireAuth,
  requireAdmin,
  validate({ params: eventParams }),
  async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({ url: await getPayoutBillUrl(req.params.eventId) });
  },
);

export default router;
