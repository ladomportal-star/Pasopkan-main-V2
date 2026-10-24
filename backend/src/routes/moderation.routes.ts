import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { db } from "../config/database.ts";
import { uploadImage, resolveImage } from "../services/media.service.ts";
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
  rejectRefund,
  createAdminRefund,
} from "../services/moderation.service.ts";
import { INITIAL_BLOG_POSTS, type BlogPost } from "../data/defaultBlogs.ts";
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
const adminOrganizerListQuery = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(["active", "suspended"]).optional(),
});
const organizerUpdateBody = z
  .object({
    name: z.string().trim().min(1).max(160).optional(),
    contactEmail: z.string().trim().email().max(254).nullable().optional(),
    contactPhone: z.string().trim().max(30).nullable().optional(),
    bankName: z.string().trim().max(100).nullable().optional(),
    accountNumber: z.string().trim().max(100).nullable().optional(),
    accountHolder: z.string().trim().max(160).nullable().optional(),
    suspended: z.boolean().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "Provide at least one organizer field",
  });

router.get("/admin/overview", requireAuth, requireAdmin, async (_req, res) => {
  const [users, organizers, eventGroups, pendingApplications, orders, paidPayments, refundGroups] =
    await Promise.all([
      db.user.count({ where: { deletedAt: null } }),
      db.organizer.count({ where: { user: { deletedAt: null } } }),
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
      deletedAt: null,
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
      db.user.count({ where: { deletedAt: null } }),
      db.user.count({ where: { isSuspended: true, deletedAt: null } }),
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
        deletedAt: null,
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

router.get(
  "/admin/organizers",
  requireAuth,
  requireAdmin,
  validate({ query: adminOrganizerListQuery }),
  async (req, res) => {
    const { search, status } = req.query as unknown as z.infer<typeof adminOrganizerListQuery>;
    const term = search?.trim();
    const where = {
      user: {
        deletedAt: null,
        role: "organizer" as const,
        ...(status ? { isSuspended: status === "suspended" } : {}),
      },
      ...(term
        ? {
            OR: [
              { name: { contains: term, mode: "insensitive" as const } },
              { contactEmail: { contains: term, mode: "insensitive" as const } },
              { contactPhone: { contains: term, mode: "insensitive" as const } },
              { bankName: { contains: term, mode: "insensitive" as const } },
              { accountNumber: { contains: term, mode: "insensitive" as const } },
              { user: { email: { contains: term, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    };
    const [organizers, total, suspended, eventCount] = await Promise.all([
      db.organizer.findMany({
        where,
        select: {
          id: true,
          name: true,
          contactEmail: true,
          contactPhone: true,
          bankName: true,
          accountNumber: true,
          accountHolder: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              publicId: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              isSuspended: true,
              suspendedAt: true,
            },
          },
          _count: { select: { events: true } },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 5000,
      }),
      db.organizer.count({ where: { user: { deletedAt: null, role: "organizer" } } }),
      db.organizer.count({
        where: { user: { deletedAt: null, role: "organizer", isSuspended: true } },
      }),
      db.event.count({
        where: { organizer: { user: { deletedAt: null, role: "organizer" } } },
      }),
    ]);
    res.setHeader("Cache-Control", "private, no-store");
    res.json({
      organizers,
      summary: { total, active: total - suspended, suspended, events: eventCount },
    });
  },
);

router.get(
  "/admin/organizers/export",
  requireAuth,
  requireAdmin,
  validate({ query: adminOrganizerListQuery }),
  async (req, res) => {
    const { search, status } = req.query as unknown as z.infer<typeof adminOrganizerListQuery>;
    const term = search?.trim();
    const organizers = await db.organizer.findMany({
      where: {
        user: {
          deletedAt: null,
          role: "organizer",
          ...(status ? { isSuspended: status === "suspended" } : {}),
        },
        ...(term
          ? {
              OR: [
                { name: { contains: term, mode: "insensitive" as const } },
                { contactEmail: { contains: term, mode: "insensitive" as const } },
                { contactPhone: { contains: term, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      select: {
        name: true,
        contactEmail: true,
        contactPhone: true,
        bankName: true,
        accountNumber: true,
        accountHolder: true,
        createdAt: true,
        user: { select: { publicId: true, email: true, isSuspended: true } },
        _count: { select: { events: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 5000,
    });
    res.setHeader("Cache-Control", "private, no-store");
    res.json({ organizers });
  },
);

router.get(
  "/admin/organizers/:id",
  requireAuth,
  requireAdmin,
  validate({ params: id }),
  async (req, res) => {
    const organizer = await db.organizer.findFirst({
      where: { id: req.params.id, user: { deletedAt: null } },
      select: {
        id: true,
        name: true,
        contactEmail: true,
        contactPhone: true,
        bankName: true,
        accountNumber: true,
        accountHolder: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            publicId: true,
            email: true,
            phone: true,
            isSuspended: true,
          },
        },
        events: {
          select: {
            id: true,
            title: true,
            status: true,
            category: true,
            eventType: true,
            startDate: true,
            venueName: true,
            coverImageUrl: true,
            createdAt: true,
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        },
      },
    });
    if (!organizer) return res.status(404).json({ error: "Organizer not found" });
    res.setHeader("Cache-Control", "private, no-store");
    res.json({ organizer });
  },
);

router.patch(
  "/admin/organizers/:id",
  requireAuth,
  requireAdmin,
  validate({ params: id, body: organizerUpdateBody }),
  async (req, res) => {
    const organizer = await db.$transaction(async (tx) => {
      const [actor, target] = await Promise.all([
        tx.user.findUnique({ where: { authId: req.user!.uid } }),
        tx.organizer.findFirst({
          where: { id: req.params.id, user: { deletedAt: null } },
          include: { user: true },
        }),
      ]);
      if (!actor || actor.role !== "admin") throw new HttpError(403, "Admins only");
      if (!target) return null;
      const updatedUser = await tx.user.update({
        where: { id: target.userId },
        data: {
          email:
            req.body.contactEmail === undefined
              ? target.user.email
              : req.body.contactEmail || target.user.email,
          phone:
            req.body.contactPhone === undefined ? target.user.phone : req.body.contactPhone || null,
          isSuspended: req.body.suspended ?? target.user.isSuspended,
          suspendedAt:
            req.body.suspended === undefined
              ? target.user.suspendedAt
              : req.body.suspended
                ? (target.user.suspendedAt ?? new Date())
                : null,
        },
      });
      const updated = await tx.organizer.update({
        where: { id: target.id },
        data: {
          name: req.body.name ?? target.name,
          contactEmail:
            req.body.contactEmail === undefined
              ? target.contactEmail
              : req.body.contactEmail || null,
          contactPhone:
            req.body.contactPhone === undefined
              ? target.contactPhone
              : req.body.contactPhone || null,
          bankName: req.body.bankName === undefined ? target.bankName : req.body.bankName || null,
          accountNumber:
            req.body.accountNumber === undefined
              ? target.accountNumber
              : req.body.accountNumber || null,
          accountHolder:
            req.body.accountHolder === undefined
              ? target.accountHolder
              : req.body.accountHolder || null,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "organizer.profile_updated",
          entityType: "Organizer",
          entityId: target.id,
          metadata: { userId: updatedUser.id },
        },
      });
      return updated;
    });
    if (!organizer) return res.status(404).json({ error: "Organizer not found" });
    res.setHeader("Cache-Control", "private, no-store");
    res.json({ organizer });
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
        firstName: z.string().trim().max(100).nullable().optional(),
        lastName: z.string().trim().max(100).nullable().optional(),
        email: z.string().trim().email().max(254).optional(),
        phone: z.string().trim().max(30).nullable().optional(),
      })
      .refine((value) => Object.values(value).some((field) => field !== undefined), {
        message: "Provide at least one user field",
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
      if (!target || target.deletedAt) return null;

      const nextRole = req.body.role ?? target.role;
      const nextSuspended = req.body.suspended ?? target.isSuspended;
      if (actor.id === target.id && (nextRole !== "admin" || nextSuspended)) {
        throw new HttpError(400, "You cannot remove or suspend your own admin access");
      }
      if (
        target.role === "admin" &&
        (nextRole !== "admin" || nextSuspended) &&
        (await tx.user.count({
          where: { role: "admin", isSuspended: false, deletedAt: null },
        })) <= 1
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
          firstName:
            req.body.firstName === undefined ? target.firstName : req.body.firstName || null,
          lastName: req.body.lastName === undefined ? target.lastName : req.body.lastName || null,
          email: req.body.email === undefined ? target.email : req.body.email,
          phone: req.body.phone === undefined ? target.phone : req.body.phone || null,
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
      if (updated.role === "organizer") {
        await tx.organizer.update({
          where: { userId: target.id },
          data: {
            name:
              [updated.firstName, updated.lastName].filter(Boolean).join(" ") ||
              updated.email ||
              target.publicId ||
              target.id,
            contactEmail: updated.email || null,
            contactPhone: updated.phone || null,
          },
        });
      }
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
            profileUpdated:
              req.body.firstName !== undefined ||
              req.body.lastName !== undefined ||
              req.body.email !== undefined ||
              req.body.phone !== undefined,
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

router.delete(
  "/admin/users/:id",
  requireAuth,
  requireAdmin,
  validate({ params: id }),
  async (req, res) => {
    const result = await db.$transaction(async (tx) => {
      const [actor, target] = await Promise.all([
        tx.user.findUnique({ where: { authId: req.user!.uid } }),
        tx.user.findUnique({ where: { id: req.params.id } }),
      ]);
      if (!actor || actor.role !== "admin") throw new HttpError(403, "Admins only");
      if (!target || target.deletedAt) return null;
      if (actor.id === target.id) throw new HttpError(400, "You cannot delete your own account");
      if (
        target.role === "admin" &&
        (await tx.user.count({ where: { role: "admin", isSuspended: false, deletedAt: null } })) <=
          1
      ) {
        throw new HttpError(409, "At least one active PskAdmin account is required");
      }
      const deletedAt = new Date();
      await tx.user.update({
        where: { id: target.id },
        data: { isSuspended: true, suspendedAt: target.suspendedAt ?? deletedAt, deletedAt },
      });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "user.deleted",
          entityType: "User",
          entityId: target.id,
          metadata: { role: target.role, deletedAt: deletedAt.toISOString() },
        },
      });
      return { id: target.id };
    });
    if (!result) return res.status(404).json({ error: "User not found" });
    res.setHeader("Cache-Control", "private, no-store");
    res.json({ success: true, user: result });
  },
);

router.get("/admin/audit-logs", requireAuth, requireAdmin, async (_req, res) => {
  const rawLogs = await db.auditLog.findMany({
    take: 100,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true,
      actor: { select: { publicId: true, email: true, firstName: true, lastName: true } },
    },
  });

  const idsByType = (type: string) => [
    ...new Set(
      rawLogs
        .filter((log) => log.entityType === type && /^[0-9a-f-]{36}$/i.test(log.entityId))
        .map((log) => log.entityId),
    ),
  ];

  const [users, events, organizers, applications, orders, refunds] = await Promise.all([
    db.user.findMany({
      where: { id: { in: idsByType("User") } },
      select: { id: true, firstName: true, lastName: true, email: true },
    }),
    db.event.findMany({
      where: { id: { in: idsByType("Event") } },
      select: { id: true, title: true },
    }),
    db.organizer.findMany({
      where: { id: { in: idsByType("Organizer") } },
      select: { id: true, name: true },
    }),
    db.organizerApplication.findMany({
      where: { id: { in: idsByType("OrganizerApplication") } },
      select: { id: true, name: true },
    }),
    db.order.findMany({
      where: { id: { in: idsByType("Order") } },
      select: { id: true, orderNumber: true, eventTitle: true },
    }),
    db.refund.findMany({
      where: { id: { in: idsByType("Refund") } },
      select: {
        id: true,
        amountKip: true,
        payment: { select: { order: { select: { orderNumber: true, eventTitle: true } } } },
      },
    }),
  ]);

  const userMap = new Map(
    users.map((u) => [u.id, [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.email]),
  );
  const eventMap = new Map(events.map((e) => [e.id, e.title]));
  const organizerMap = new Map(organizers.map((o) => [o.id, o.name]));
  const appMap = new Map(applications.map((a) => [a.id, a.name]));
  const orderMap = new Map(orders.map((o) => [o.id, `${o.orderNumber} (${o.eventTitle})`]));
  const refundMap = new Map(
    refunds.map((r) => [
      r.id,
      `${r.payment.order.eventTitle} · ${r.amountKip.toLocaleString("en-US")} LAK`,
    ]),
  );

  const logs = rawLogs.map((log) => {
    const meta =
      log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
        ? (log.metadata as Record<string, unknown>)
        : {};
    const targetName =
      log.entityType === "User"
        ? userMap.get(log.entityId)
        : log.entityType === "Event"
          ? eventMap.get(log.entityId)
          : log.entityType === "Organizer"
            ? organizerMap.get(log.entityId)
            : log.entityType === "OrganizerApplication"
              ? appMap.get(log.entityId)
              : log.entityType === "Order"
                ? orderMap.get(log.entityId)
                : log.entityType === "Refund"
                  ? refundMap.get(log.entityId)
                  : log.entityType === "NotificationBroadcast" && typeof meta.title === "string"
                    ? meta.title
                    : null;
    return { ...log, targetName: targetName ?? null };
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
        reviewer: { select: { firstName: true, lastName: true, email: true } },
        payment: {
          select: {
            provider: true,
            providerTransactionId: true,
            amountKip: true,
            order: {
              select: {
                orderNumber: true,
                eventTitle: true,
                buyerName: true,
                buyerEmail: true,
                buyerPhone: true,
                user: {
                  select: {
                    publicId: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                  },
                },
                items: {
                  select: {
                    id: true,
                    tierName: true,
                    unitPriceKip: true,
                    ticketCode: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  });
});
router.post(
  "/admin/refunds",
  requireAuth,
  requireAdmin,
  validate({
    body: z.object({
      reference: z.string().trim().min(1).max(160),
      amountKip: z.number().int().positive().max(2147483647).optional(),
      reason: z.string().trim().min(1).max(500),
    }),
  }),
  async (req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    res.status(201).json({
      refund: await createAdminRefund(req.user!.uid, req.body),
    });
  },
);
router.post(
  "/admin/refunds/batch",
  requireAuth,
  requireAdmin,
  validate({
    body: z.object({
      ids: z.array(z.string().uuid()).min(1).max(100),
      action: z.enum(["approve", "reject"]),
    }),
  }),
  async (req, res) => {
    const handler = req.body.action === "approve" ? approveRefund : rejectRefund;
    const results = [];
    for (const refundId of req.body.ids) {
      results.push(await handler(req.user!.uid, refundId));
    }
    res.setHeader("Cache-Control", "private, no-store");
    res.json({ refunds: results, providerExecution: "not_configured" });
  },
);
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
router.post(
  "/admin/refunds/:id/reject",
  requireAuth,
  requireAdmin,
  validate({ params: id }),
  async (req, res) => {
    res.json({
      refund: await rejectRefund(req.user!.uid, req.params.id),
    });
  },
);

router.get("/admin/notifications", requireAuth, requireAdmin, async (_req, res) => {
  const logs = await db.auditLog.findMany({
    where: { action: "notification.broadcast" },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 50,
  });

  const broadcasts = await Promise.all(
    logs.map(async (log) => {
      const meta =
        log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
          ? (log.metadata as Record<string, unknown>)
          : {};
      const broadcastId = typeof meta.broadcastId === "string" ? meta.broadcastId : log.entityId;
      const readCount = await db.notification.count({
        where: {
          readAt: { not: null },
          data: { path: ["broadcastId"], equals: broadcastId },
        },
      });
      return {
        id: broadcastId,
        title: typeof meta.title === "string" ? meta.title : "Notification",
        message: typeof meta.message === "string" ? meta.message : "",
        category: meta.category === "urgent" ? "urgent" : "new_event",
        audience: meta.audience === "organizers" ? "organizers" : "all",
        imageUrl: typeof meta.imageUrl === "string" ? meta.imageUrl : null,
        scheduledAt: typeof meta.scheduledAt === "string" ? meta.scheduledAt : null,
        recipientCount: typeof meta.recipientCount === "number" ? meta.recipientCount : 0,
        readCount,
        createdAt: log.createdAt.toISOString(),
      };
    }),
  );

  res.setHeader("Cache-Control", "private, no-store");
  res.json({ broadcasts });
});

router.post(
  "/admin/notifications/broadcast",
  requireAuth,
  requireAdmin,
  validate({
    body: z.object({
      title: z.string().trim().min(1).max(200),
      message: z.string().trim().min(1).max(2000),
      category: z.enum(["new_event", "urgent"]).default("new_event"),
      audience: z.enum(["all", "organizers"]).default("all"),
      imageDataUrl: z
        .string()
        .max(7 * 1024 * 1024)
        .nullable()
        .optional(),
      scheduledAt: z.string().trim().max(64).nullable().optional(),
    }),
  }),
  async (req, res) => {
    const admin = await db.user.findUnique({ where: { authId: req.user!.uid } });
    if (!admin || admin.role !== "admin") throw new HttpError(403, "Admins only");

    let imageUrl: string | null = null;
    if (req.body.imageDataUrl) {
      const ref = await uploadImage(req.user!.uid, req.body.imageDataUrl, "public");
      imageUrl = await resolveImage(req.user!.uid, ref);
    }

    const recipients = await db.user.findMany({
      where: {
        deletedAt: null,
        isSuspended: false,
        ...(req.body.audience === "organizers" ? { role: "organizer" } : {}),
      },
      select: { id: true },
    });

    const broadcastId = randomUUID();
    const notificationType = req.body.category === "urgent" ? "system" : "upcomingEvent";
    const payloadData = {
      broadcastId,
      category: req.body.category,
      audience: req.body.audience,
      ...(imageUrl ? { imageUrl } : {}),
      ...(req.body.scheduledAt ? { scheduledAt: req.body.scheduledAt } : {}),
    };

    await db.$transaction(async (tx) => {
      if (recipients.length > 0) {
        await tx.notification.createMany({
          data: recipients.map((recipient) => ({
            userId: recipient.id,
            type: notificationType,
            title: req.body.title,
            titleLo: req.body.title,
            message: req.body.message,
            messageLo: req.body.message,
            data: payloadData,
          })),
        });
      }
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "notification.broadcast",
          entityType: "NotificationBroadcast",
          entityId: broadcastId,
          metadata: {
            broadcastId,
            title: req.body.title,
            message: req.body.message,
            category: req.body.category,
            audience: req.body.audience,
            imageUrl,
            scheduledAt: req.body.scheduledAt ?? null,
            recipientCount: recipients.length,
          },
        },
      });
    });

    res.setHeader("Cache-Control", "private, no-store");
    res.status(201).json({
      broadcast: {
        id: broadcastId,
        title: req.body.title,
        message: req.body.message,
        category: req.body.category,
        audience: req.body.audience,
        imageUrl,
        scheduledAt: req.body.scheduledAt ?? null,
        recipientCount: recipients.length,
        readCount: 0,
        createdAt: new Date().toISOString(),
      },
    });
  },
);

const siteSettingKeyParam = z.object({
  key: z.enum([
    "contact_us",
    "support",
    "terms_conditions",
    "privacy_policy",
    "organizer_terms",
    "home_hero",
    "ticket_sponsors",
    "blogs",
  ]),
});

async function loadStoredBlogs(client: {
  siteSetting: typeof db.siteSetting;
}): Promise<BlogPost[]> {
  const row = await client.siteSetting.findUnique({ where: { id: "blogs" } });
  const rawItems = (row?.data as { items?: unknown } | null)?.items;
  if (Array.isArray(rawItems)) {
    return (rawItems as BlogPost[])
      // Ignore the known starter/demo posts if an earlier version stored them.
      // This does not delete database content; it keeps sample content out of the API/UI.
      .filter((post) => INITIAL_BLOG_POSTS.every(
        (sample) => sample.id !== post.id || sample.coverImage !== post.coverImage,
      ));
  }
  return [];
}

const blogPostInputSchema = z.object({
  title: z.string().trim().min(1).max(300),
  titleLao: z.string().trim().max(300).optional(),
  slug: z.string().trim().max(300).optional(),
  excerpt: z.string().trim().max(1000).optional(),
  excerptLao: z.string().trim().max(1000).optional(),
  content: z.string().trim().min(1).max(100000),
  contentLao: z.string().trim().max(100000).optional(),
  coverImage: z.string().trim().min(1).max(2000000),
  isPublished: z.boolean().optional(),
  featured: z.boolean().optional(),
  tags: z.array(z.string().trim().max(60)).max(20).optional(),
});

const blogIdParam = z.object({
  id: z.string().trim().min(1).max(120),
});

router.get("/blogs", async (_req, res) => {
  const blogs = await loadStoredBlogs(db);
  res.setHeader("Cache-Control", "no-store");
  res.json({ blogs });
});

router.post(
  "/admin/blogs",
  requireAuth,
  requireAdmin,
  validate({ body: blogPostInputSchema }),
  async (req, res) => {
    const admin = await db.user.findUnique({ where: { authId: req.user!.uid } });
    if (!admin || admin.role !== "admin") throw new HttpError(403, "Admins only");

    const nowIso = new Date().toISOString();
    const todayDate = nowIso.split("T")[0];
    const slug =
      req.body.slug ||
      req.body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") ||
      `post-${Date.now()}`;
    const defaultExcerpt = `${req.body.content.slice(0, 160)}...`;

    const newBlog: BlogPost = {
      id: `blog-${Date.now()}`,
      title: req.body.title,
      titleLao: req.body.titleLao ?? req.body.title,
      slug,
      excerpt: req.body.excerpt || defaultExcerpt,
      excerptLao: req.body.excerptLao || req.body.excerpt || defaultExcerpt,
      content: req.body.content,
      contentLao: req.body.contentLao ?? req.body.content,
      coverImage: req.body.coverImage,
      author: {
        name:
          [admin.firstName, admin.lastName].filter(Boolean).join(" ").trim() ||
          "Pasopkan Admin",
        role: "Administrator",
      },
      publishedAt: todayDate,
      updatedAt: nowIso,
      isPublished: req.body.isPublished ?? true,
      featured: req.body.featured ?? false,
      tags: req.body.tags ?? [],
    };

    const blogs = await db.$transaction(async (tx) => {
      const current = await loadStoredBlogs(tx);
      const next = [newBlog, ...current];
      await tx.siteSetting.upsert({
        where: { id: "blogs" },
        create: { id: "blogs", data: { items: next } as unknown as object },
        update: { data: { items: next } as unknown as object },
      });
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "blog.created",
          entityType: "Blog",
          entityId: newBlog.id,
          metadata: { title: newBlog.title },
        },
      });
      return next;
    });

    res.setHeader("Cache-Control", "private, no-store");
    res.status(201).json({ blog: newBlog, blogs });
  },
);

router.put(
  "/admin/blogs/:id",
  requireAuth,
  requireAdmin,
  validate({ params: blogIdParam, body: blogPostInputSchema }),
  async (req, res) => {
    const admin = await db.user.findUnique({ where: { authId: req.user!.uid } });
    if (!admin || admin.role !== "admin") throw new HttpError(403, "Admins only");

    const nowIso = new Date().toISOString();
    const todayDate = nowIso.split("T")[0];

    const result = await db.$transaction(async (tx) => {
      const current = await loadStoredBlogs(tx);
      const existing = current.find((b) => b.id === req.params.id);
      if (!existing) return null;

      const defaultExcerpt = `${req.body.content.slice(0, 160)}...`;
      const updatedBlog: BlogPost = {
        ...existing,
        title: req.body.title,
        titleLao: req.body.titleLao ?? req.body.title,
        slug:
          req.body.slug ||
          req.body.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "") ||
          existing.slug,
        excerpt: req.body.excerpt || defaultExcerpt,
        excerptLao: req.body.excerptLao || req.body.excerpt || defaultExcerpt,
        content: req.body.content,
        contentLao: req.body.contentLao ?? req.body.content,
        coverImage: req.body.coverImage || existing.coverImage,
        isPublished: req.body.isPublished ?? existing.isPublished,
        tags: req.body.tags ?? existing.tags ?? [],
        publishedAt: todayDate,
        updatedAt: nowIso,
      };

      const remaining = current.filter((b) => b.id !== req.params.id);
      const next = [updatedBlog, ...remaining];

      await tx.siteSetting.upsert({
        where: { id: "blogs" },
        create: { id: "blogs", data: { items: next } as unknown as object },
        update: { data: { items: next } as unknown as object },
      });
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "blog.updated",
          entityType: "Blog",
          entityId: updatedBlog.id,
          metadata: { title: updatedBlog.title },
        },
      });
      return { blog: updatedBlog, blogs: next };
    });

    if (!result) throw new HttpError(404, "Blog article not found");
    res.setHeader("Cache-Control", "private, no-store");
    res.json(result);
  },
);

router.patch(
  "/admin/blogs/:id/toggle",
  requireAuth,
  requireAdmin,
  validate({ params: blogIdParam }),
  async (req, res) => {
    const admin = await db.user.findUnique({ where: { authId: req.user!.uid } });
    if (!admin || admin.role !== "admin") throw new HttpError(403, "Admins only");

    const result = await db.$transaction(async (tx) => {
      const current = await loadStoredBlogs(tx);
      let updatedItem: BlogPost | null = null;
      const next = current.map((b) => {
        if (b.id === req.params.id) {
          updatedItem = {
            ...b,
            isPublished: !b.isPublished,
            updatedAt: new Date().toISOString(),
          };
          return updatedItem;
        }
        return b;
      });
      if (!updatedItem) return null;

      await tx.siteSetting.upsert({
        where: { id: "blogs" },
        create: { id: "blogs", data: { items: next } as unknown as object },
        update: { data: { items: next } as unknown as object },
      });
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "blog.status_changed",
          entityType: "Blog",
          entityId: (updatedItem as BlogPost).id,
          metadata: {
            title: (updatedItem as BlogPost).title,
            isPublished: (updatedItem as BlogPost).isPublished,
          },
        },
      });
      return { blog: updatedItem as BlogPost, blogs: next };
    });

    if (!result) throw new HttpError(404, "Blog article not found");
    res.setHeader("Cache-Control", "private, no-store");
    res.json(result);
  },
);

router.delete(
  "/admin/blogs/:id",
  requireAuth,
  requireAdmin,
  validate({ params: blogIdParam }),
  async (req, res) => {
    const admin = await db.user.findUnique({ where: { authId: req.user!.uid } });
    if (!admin || admin.role !== "admin") throw new HttpError(403, "Admins only");

    const result = await db.$transaction(async (tx) => {
      const current = await loadStoredBlogs(tx);
      const removed = current.find((b) => b.id === req.params.id);
      if (!removed) return null;
      const next = current.filter((b) => b.id !== req.params.id);

      await tx.siteSetting.upsert({
        where: { id: "blogs" },
        create: { id: "blogs", data: { items: next } as unknown as object },
        update: { data: { items: next } as unknown as object },
      });
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "blog.deleted",
          entityType: "Blog",
          entityId: removed.id,
          metadata: { title: removed.title },
        },
      });
      return { blogs: next };
    });

    if (!result) throw new HttpError(404, "Blog article not found");
    res.setHeader("Cache-Control", "private, no-store");
    res.json(result);
  },
);

router.get("/site-settings/:key", validate({ params: siteSettingKeyParam }), async (req, res) => {
  const row = await db.siteSetting.findUnique({ where: { id: req.params.key } });
  res.setHeader("Cache-Control", "no-store");
  res.json({ data: row?.data ?? null });
});

router.put(
  "/admin/site-settings/:key",
  requireAuth,
  requireAdmin,
  validate({
    params: siteSettingKeyParam,
    body: z.object({
      data: z.record(z.string(), z.unknown()),
    }),
  }),
  async (req, res) => {
    const admin = await db.user.findUnique({ where: { authId: req.user!.uid } });
    if (!admin || admin.role !== "admin") throw new HttpError(403, "Admins only");

    const saved = await db.$transaction(async (tx) => {
      const row = await tx.siteSetting.upsert({
        where: { id: req.params.key },
        create: { id: req.params.key, data: req.body.data as object },
        update: { data: req.body.data as object },
      });
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "site_settings.updated",
          entityType: "SiteSetting",
          entityId: req.params.key,
        },
      });
      return row;
    });

    res.setHeader("Cache-Control", "private, no-store");
    res.json({ data: saved.data });
  },
);
export default router;
