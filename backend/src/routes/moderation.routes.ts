import { Router } from "express";
import { z } from "zod";
import { db } from "../config/database.ts";
import {
  requireAuth,
  requireRegisteredUser,
  requireAdmin,
} from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import {
  applyAsOrganizer,
  reviewOrganizer,
  cancelEvent,
  approveRefund,
} from "../services/moderation.service.ts";
const router = Router();
const id = z.object({ id: z.string().uuid() });
router.get(
  "/admin/events",
  requireAuth,
  requireAdmin,
  validate({
    query: z.object({
      cursor: z.string().uuid().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(50),
    }),
  }),
  async (req, res) => {
    const limit = Number(req.query.limit);
    const cursor = req.query.cursor as string | undefined;
    const rows = await db.event.findMany({
      include: { organizer: true, tiers: true },
      orderBy: { id: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const more = rows.length > limit;
    const events = rows.slice(0, limit);
    res.json({
      events,
      nextCursor: more ? events.at(-1)?.id : null,
    });
  },
);
router.post(
  "/organizer-applications",
  requireAuth,
  requireRegisteredUser,
  validate({
    body: z.object({
      name: z.string().trim().min(1).max(200),
      description: z.string().max(5000).optional(),
    }),
  }),
  async (req, res) => {
    res.status(201).json({
      application: await applyAsOrganizer(req.user!.uid, req.body.name, req.body.description),
    });
  },
);
router.get("/organizer-applications/mine", requireAuth, async (req, res) => {
  res.json({
    applications: await db.organizerApplication.findMany({
      where: { user: { authId: req.user!.uid } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  });
});
router.get("/admin/organizer-applications", requireAuth, requireAdmin, async (_req, res) => {
  res.json({
    applications: await db.organizerApplication.findMany({
      where: { status: "pending" },
      take: 100,
      orderBy: { createdAt: "asc" },
    }),
  });
});
router.post(
  "/admin/organizer-applications/:id/review",
  requireAuth,
  requireAdmin,
  validate({
    params: id,
    body: z.object({ approve: z.boolean(), reason: z.string().trim().min(1).max(2000).optional() }),
  }),
  async (req, res) => {
    res.json({
      application: await reviewOrganizer(
        req.user!.uid,
        req.params.id,
        req.body.approve,
        req.body.reason,
      ),
    });
  },
);
router.post(
  "/admin/events/:id/cancel",
  requireAuth,
  requireAdmin,
  validate({ params: id }),
  async (req, res) => {
    res.json({ event: await cancelEvent(req.user!.uid, req.params.id) });
  },
);
router.get("/admin/refunds", requireAuth, requireAdmin, async (_req, res) => {
  res.json({ refunds: await db.refund.findMany({ take: 100, orderBy: { createdAt: "desc" } }) });
});
router.post(
  "/admin/refunds/:id/approve",
  requireAuth,
  requireAdmin,
  validate({ params: id }),
  async (req, res) => {
    res.json({
      refund: await approveRefund(req.user!.uid, req.params.id),
      providerExecution: "not_configured",
    });
  },
);
export default router;
