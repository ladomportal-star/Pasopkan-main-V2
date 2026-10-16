import { Router } from "express";
import { z } from "zod";
import { db } from "../config/database.ts";
import { HttpError } from "../middlewares/error.middleware.ts";
import { requireAuth, requireRegisteredUser } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";

const router = Router();

router.get("/organizer/terms-acceptance", requireAuth, requireRegisteredUser, async (req, res) => {
  const user = await db.user.findUnique({
    where: { authId: req.user!.uid },
    select: { role: true, organizerTermsAcceptedAt: true, organizer: { select: { id: true } } },
  });
  if (!user || (user.role !== "admin" && (user.role !== "organizer" || !user.organizer)))
    throw new HttpError(403, "An approved organizer profile is required");
  res.setHeader("Cache-Control", "no-store");
  res.json({
    accepted: user.role === "admin" || Boolean(user.organizerTermsAcceptedAt),
    acceptedAt: user.organizerTermsAcceptedAt,
  });
});

router.post(
  "/organizer/terms-acceptance",
  requireAuth,
  requireRegisteredUser,
  validate({ body: z.object({ accepted: z.literal(true) }) }),
  async (req, res) => {
    const user = await db.user.findUnique({
      where: { authId: req.user!.uid },
      select: { id: true, role: true, organizer: { select: { id: true } } },
    });
    if (!user || (user.role !== "admin" && (user.role !== "organizer" || !user.organizer)))
      throw new HttpError(403, "An approved organizer profile is required");
    if (user.role === "admin") return res.json({ accepted: true, acceptedAt: null });

    const acceptedAt = await db.$transaction(async (tx) => {
      const now = new Date();
      const changed = await tx.user.updateMany({
        where: { id: user.id, organizerTermsAcceptedAt: null },
        data: { organizerTermsAcceptedAt: now },
      });
      if (changed.count) {
        await tx.auditLog.create({
          data: {
            actorId: user.id,
            action: "organizer.terms_accepted",
            entityType: "User",
            entityId: user.id,
            metadata: { at: now.toISOString() },
          },
        });
      }
      const saved = await tx.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { organizerTermsAcceptedAt: true },
      });
      return saved.organizerTermsAcceptedAt;
    });
    res.setHeader("Cache-Control", "no-store");
    return res.json({ accepted: true, acceptedAt });
  },
);

export default router;
