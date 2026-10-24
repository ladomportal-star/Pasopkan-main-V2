import { Router } from "express";
import { z } from "zod";
import { db } from "../config/database.ts";
import {
  requireAuth,
  requireRegisteredUser,
  requireAdmin,
} from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { HttpError } from "../middlewares/error.middleware.ts";
import {
  applyAsOrganizer,
  activateOrganizer,
  reviewOrganizer,
  cancelEvent,
  approveRefund,
} from "../services/moderation.service.ts";
const router = Router();
const id = z.object({ id: z.string().uuid() });
const adminListQuery = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(100).optional(),
  role: z.enum(["user", "organizer", "admin"]).optional(),
  status: z.enum(["active", "suspended"]).optional(),
});
const adminExportQuery = adminListQuery.omit({ cursor: true, limit: true });

router.get("/admin/overview", requireAuth, requireAdmin, async (_req, res) => {
  const [users, organizers, eventGroups, pendingApplications, orders, paidPayments, refundGroups] =
    await Promise.all([
      db.user.count(),
      db.organizer.count(),
      db.event.groupBy({ by: ["status"], _count: { _all: true } }),
      db.organizerApplication.count({ where: { status: "pending" } }),
      db.order.groupBy({ by: ["status"], _count: { _all: true } }),
      db.payment.aggregate({
        where: { state: "completed", verifiedAt: { not: null } },
        _count: { _all: true },
        _sum: { amountKip: true },
      }),
      db.refund.groupBy({ by: ["status"], _count: { _all: true }, _sum: { amountKip: true } }),
    ]);
  const countBy = <T extends { status: string; _count: { _all: number } }>(
    groups: T[],
    status: string,
  ) => groups.find((group) => group.status === status)?._count._all ?? 0;
  const refundedAmountKip =
    refundGroups.find((group) => group.status === "succeeded")?._sum.amountKip ?? 0;
  res.setHeader("Cache-Control", "private, no-store");
  res.json({
    users,
    organizers,
    events: {
      total: eventGroups.reduce((total, group) => total + group._count._all, 0),
      pendingReview: countBy(eventGroups, "pending_review"),
      published: countBy(eventGroups, "published"),
      cancelled: countBy(eventGroups, "cancelled"),
    },
    organizerApplicationsPending: pendingApplications,
    orders: {
      total: orders.reduce((total, group) => total + group._count._all, 0),
      pending: countBy(orders, "pending"),
      confirmed: countBy(orders, "confirmed"),
    },
    verifiedPayments: {
      count: paidPayments._count._all,
      grossKip: paidPayments._sum.amountKip ?? 0,
    },
    refunds: {
      pendingApproval: countBy(refundGroups, "pending_approval"),
      processing: countBy(refundGroups, "processing"),
      succeeded: countBy(refundGroups, "succeeded"),
      refundedKip: refundedAmountKip,
    },
    payouts: { enabled: false },
  });
});

// Only verified provider payments contribute to sales analytics. Never synthesize sales.
router.get("/admin/analytics", requireAuth, requireAdmin, async (_req, res) => {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 89);
  since.setUTCHours(0, 0, 0, 0);
  const [dailyRows, categories, recentPayments] = await Promise.all([
    db.$queryRaw<Array<{ day: Date; tickets: bigint; revenueKip: bigint }>>`
      SELECT date_trunc('day', p."verifiedAt" AT TIME ZONE 'Asia/Vientiane') AS day,
             COALESCE(SUM(CASE WHEN p.order_rank = 1 THEN item_count.tickets ELSE 0 END), 0)::bigint AS tickets,
             COALESCE(SUM(p."amountKip"), 0)::bigint AS "revenueKip"
      FROM (
        SELECT p0.*, ROW_NUMBER() OVER (
          PARTITION BY p0."orderId" ORDER BY p0."verifiedAt", p0.id
        ) AS order_rank
        FROM "Payment" p0
        WHERE p0.state = 'completed' AND p0."verifiedAt" IS NOT NULL
          AND p0."verifiedAt" >= ${since}
      ) p
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::bigint AS tickets FROM "OrderItem" oi WHERE oi."orderId" = p."orderId"
      ) item_count ON true
      GROUP BY 1 ORDER BY 1 ASC
    `,
    db.event.groupBy({ by: ["category"], _count: { _all: true } }),
    db.payment.findMany({
      where: { state: "completed", verifiedAt: { not: null } },
      orderBy: { verifiedAt: "desc" },
      take: 8,
      select: {
        id: true,
        amountKip: true,
        verifiedAt: true,
        order: { select: { eventTitle: true, _count: { select: { items: true } } } },
      },
    }),
  ]);
  res.setHeader("Cache-Control", "private, no-store");
  res.json({
    daily: dailyRows.map((row) => ({
      day: row.day.toISOString().slice(0, 10),
      tickets: Number(row.tickets),
      revenueKip: Number(row.revenueKip),
    })),
    categories: categories.map((row) => ({
      name: row.category || "Uncategorized",
      count: row._count._all,
    })),
    recentSales: recentPayments.map((payment) => ({
      id: payment.id,
      title: payment.order.eventTitle,
      tickets: payment.order._count.items,
      amountKip: payment.amountKip,
      verifiedAt: payment.verifiedAt,
    })),
  });
});

router.get(
  "/admin/users",
  requireAuth,
  requireAdmin,
  validate({ query: adminListQuery }),
  async (req, res) => {
    const { cursor, limit, search, role, status } = req.query as unknown as z.infer<
      typeof adminListQuery
    >;
    const term = search?.trim();
    const where = {
      ...(role ? { role } : {}),
      ...(status ? { isSuspended: status === "suspended" } : {}),
      ...(term
        ? {
            OR: [
              { email: { contains: term, mode: "insensitive" as const } },
              { firstName: { contains: term, mode: "insensitive" as const } },
              { lastName: { contains: term, mode: "insensitive" as const } },
              { publicId: { contains: term, mode: "insensitive" as const } },
              { phone: { contains: term, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };
    const rows = await db.user.findMany({
      where,
      select: {
        id: true,
        publicId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isSuspended: true,
        suspendedAt: true,
        createdAt: true,
        organizer: { select: { name: true } },
        _count: { select: { orders: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > limit;
    const users = rows.slice(0, limit);
    const [total, suspended] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { isSuspended: true } }),
    ]);
    res.setHeader("Cache-Control", "private, no-store");
    res.json({
      users,
      nextCursor: hasMore ? (users.at(-1)?.id ?? null) : null,
      summary: { total, active: total - suspended, suspended },
    });
  },
);

router.get(
  "/admin/users/export",
  requireAuth,
  requireAdmin,
  validate({ query: adminExportQuery }),
  async (req, res) => {
    const { search, role, status } = req.query as unknown as z.infer<typeof adminExportQuery>;
    const term = search?.trim();
    const users = await db.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(status ? { isSuspended: status === "suspended" } : {}),
        ...(term
          ? {
              OR: [
                { email: { contains: term, mode: "insensitive" as const } },
                { firstName: { contains: term, mode: "insensitive" as const } },
                { lastName: { contains: term, mode: "insensitive" as const } },
                { publicId: { contains: term, mode: "insensitive" as const } },
                { phone: { contains: term, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      select: {
        publicId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isSuspended: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 5000,
    });
    res.setHeader("Cache-Control", "private, no-store");
    res.json({ users });
  },
);

router.patch(
  "/admin/users/:id",
  requireAuth,
  requireAdmin,
  validate({
    params: id,
    body: z
      .object({
        role: z.enum(["user", "organizer", "admin"]).optional(),
        suspended: z.boolean().optional(),
      })
      .refine((value) => value.role !== undefined || value.suspended !== undefined, {
        message: "Provide a role or suspended state",
      }),
  }),
  async (req, res) => {
    const result = await db.$transaction(async (tx) => {
      const [actor, target] = await Promise.all([
        tx.user.findUnique({ where: { authId: req.user!.uid } }),
        tx.user.findUnique({
          where: { id: req.params.id },
          include: { organizer: true },
        }),
      ]);
      if (!actor || actor.role !== "admin") throw new HttpError(403, "Admins only");
      if (!target) return null;

      const nextRole = req.body.role ?? target.role;
      const nextSuspended = req.body.suspended ?? target.isSuspended;
      if (actor.id === target.id && (nextRole !== "admin" || nextSuspended)) {
        throw new HttpError(400, "You cannot remove or suspend your own admin access");
      }
      if (
        target.role === "admin" &&
        (nextRole !== "admin" || nextSuspended) &&
        (await tx.user.count({ where: { role: "admin", isSuspended: false } })) <= 1
      ) {
        throw new HttpError(409, "At least one active PskAdmin account is required");
      }

      if (nextRole === "organizer" && !target.organizer) {
        await tx.organizer.create({
          data: {
            userId: target.id,
            name:
              [target.firstName, target.lastName].filter(Boolean).join(" ") ||
              target.email ||
              target.publicId ||
              target.id,
            contactEmail: target.email || null,
            contactPhone: target.phone || null,
          },
        });
      }
      const updated = await tx.user.update({
        where: { id: target.id },
        data: {
          role: nextRole,
          isSuspended: nextSuspended,
          suspendedAt: nextSuspended ? (target.suspendedAt ?? new Date()) : null,
        },
        select: {
          id: true,
          publicId: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isSuspended: true,
          suspendedAt: true,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "user.access_updated",
          entityType: "User",
          entityId: target.id,
          metadata: {
            previousRole: target.role,
            role: updated.role,
            previousSuspended: target.isSuspended,
            suspended: updated.isSuspended,
          },
        },
      });
      return updated;
    });
    if (!result) return res.status(404).json({ error: "User not found" });
    res.setHeader("Cache-Control", "private, no-store");
    res.json({ user: result });
  },
);

router.get("/admin/audit-logs", requireAuth, requireAdmin, async (_req, res) => {
  const logs = await db.auditLog.findMany({
    take: 50,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      createdAt: true,
      actor: { select: { publicId: true, firstName: true, lastName: true } },
    },
  });
  res.setHeader("Cache-Control", "private, no-store");
  res.json({ logs });
});

router.get("/organizer/eligibility", requireAuth, requireRegisteredUser, async (req, res) => {
  const user = await db.user.findUnique({
    where: { authId: req.user!.uid },
    include: { organizer: true },
  });
  res.setHeader("Cache-Control", "no-store");
  res.json({
    role: user?.role ?? "user",
    canCreateEvent:
      user?.role === "admin" || (user?.role === "organizer" && Boolean(user.organizer)),
  });
});
router.post("/organizer/activate", requireAuth, requireRegisteredUser, async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json(await activateOrganizer(req.user!.uid));
});
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
    const urgentFrom = new Date();
    urgentFrom.setUTCHours(0, 0, 0, 0);
    const urgentUntil = new Date(urgentFrom);
    urgentUntil.setUTCDate(urgentUntil.getUTCDate() + 14);
    const [rows, pendingReview, urgentPendingReview] = await Promise.all([
      db.event.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          dateType: true,
          eventType: true,
          category: true,
          venueName: true,
          addressText: true,
          province: true,
          district: true,
          description: true,
          rejectionReason: true,
          startDate: true,
          startTime: true,
          endDate: true,
          endTime: true,
          coverImageUrl: true,
          viewsCount: true,
          createdAt: true,
          organizer: {
            select: {
              id: true,
              name: true,
              contactEmail: true,
              contactPhone: true,
              user: { select: { publicId: true, email: true, phone: true } },
            },
          },
          privateDetails: {
            select: { bankName: true, accountNumber: true, accountHolder: true },
          },
          tiers: {
            select: {
              id: true,
              name: true,
              priceKip: true,
              quantityTotal: true,
              quantitySold: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      db.event.count({ where: { status: "pending_review" } }),
      db.event.count({
        where: {
          status: "pending_review",
          startDate: { gte: urgentFrom, lte: urgentUntil },
        },
      }),
    ]);
    const more = rows.length > limit;
    const events = rows.slice(0, limit);
    res.json({
      events,
      nextCursor: more ? events.at(-1)?.id : null,
      pendingReviewSummary: { total: pendingReview, urgent: urgentPendingReview },
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
      include: {
        user: { select: { publicId: true, email: true, firstName: true, lastName: true } },
      },
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
  res.setHeader("Cache-Control", "private, no-store");
  res.json({
    refunds: await db.refund.findMany({
      take: 100,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        payment: {
          select: {
            provider: true,
            providerTransactionId: true,
            order: {
              select: {
                orderNumber: true,
                eventTitle: true,
                user: { select: { publicId: true, email: true } },
              },
            },
          },
        },
      },
    }),
  });
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
