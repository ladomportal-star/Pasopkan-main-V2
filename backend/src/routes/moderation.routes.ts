import { Router } from "express";
import { z } from "zod";
import { db } from "../config/database.ts";
import { requireAuth, requireRegisteredUser, requireAdmin } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { applyAsOrganizer, reviewOrganizer, cancelEvent, approveRefund } from "../services/moderation.service.ts";
const router = Router();
const id = z.object({ id: z.string().uuid() });
router.get("/admin/events", requireAuth, requireAdmin, async (_req, res) => {
  res.json({ events: await db.event.findMany({ where: { status: "pending_review" }, include: { organizer: true, tiers: true }, orderBy: { updatedAt: "asc" }, take: 100 }) });
});
router.post("/organizer-applications", requireAuth, requireRegisteredUser, validate({ body: z.object({ name: z.string().trim().min(1).max(200), description: z.string().max(5000).optional() }) }), async (req, res) => {
  res.status(201).json({ application: await applyAsOrganizer(req.user!.uid, req.body.name, req.body.description) });
});
router.get("/organizer-applications/mine", requireAuth, async (req, res) => {
  res.json({ applications: await db.organizerApplication.findMany({ where: { user: { authId: req.user!.uid } }, orderBy: { createdAt: "desc" }, take: 100 }) });
});
router.get("/admin/organizer-applications", requireAuth, requireAdmin, async (_req, res) => {
  res.json({ applications: await db.organizerApplication.findMany({ where: { status: "pending" }, take: 100, orderBy: { createdAt: "asc" } }) });
});
router.post("/admin/organizer-applications/:id/review", requireAuth, requireAdmin, validate({ params: id, body: z.object({ approve: z.boolean(), reason: z.string().trim().min(1).max(2000).optional() }) }), async (req, res) => {
  res.json({ application: await reviewOrganizer(req.user!.uid, req.params.id, req.body.approve, req.body.reason) });
});
router.post("/admin/events/:id/cancel", requireAuth, requireAdmin, validate({ params: id }), async (req, res) => {
  res.json({ event: await cancelEvent(req.user!.uid, req.params.id) });
});
router.get("/admin/refunds", requireAuth, requireAdmin, async (_req, res) => {
  res.json({ refunds: await db.refund.findMany({ take: 100, orderBy: { createdAt: "desc" } }) });
});
router.post("/admin/refunds/:id/approve", requireAuth, requireAdmin, validate({ params: id }), async (req, res) => {
  res.json({ refund: await approveRefund(req.user!.uid, req.params.id), providerExecution: "not_configured" });
});
export default router;
