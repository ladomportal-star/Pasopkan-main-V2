import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRegisteredUser } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { assignEventStaff, listEventStaff, revokeEventStaff } from "../services/staff.service.ts";

const router = Router();
const eventParams = z.object({ id: z.string().uuid() });
const staffAssignmentParams = z.object({ id: z.string().uuid(), assignmentId: z.string().uuid() });
const assignStaffBody = z
  .object({
    identifier: z.string().trim().min(1).max(254).optional(),
    gateLabel: z.string().trim().max(100).optional(),
    // Keep accepting the old field while older deployed clients update.
    email: z.email().trim().max(254).optional(),
  })
  .refine((body) => Boolean(body.identifier || body.email), {
    message: "Enter a registered staff email or account name",
    path: ["identifier"],
  });

router.get(
  "/events/:id/staff",
  requireAuth,
  requireRegisteredUser,
  validate({ params: eventParams }),
  async (req, res) => {
    res.json({ staff: await listEventStaff(req.params.id, req.user!.uid) });
  },
);

router.post(
  "/events/:id/staff",
  requireAuth,
  requireRegisteredUser,
  validate({
    params: eventParams,
    body: assignStaffBody,
  }),
  async (req, res) => {
    res.status(201).json({
      staff: await assignEventStaff(
        req.params.id,
        req.body.identifier ?? req.body.email,
        req.body.gateLabel,
        req.user!.uid,
      ),
    });
  },
);

router.delete(
  "/events/:id/staff/:assignmentId",
  requireAuth,
  requireRegisteredUser,
  validate({ params: staffAssignmentParams }),
  async (req, res) => {
    res.json({
      staff: await revokeEventStaff(req.params.id, req.params.assignmentId, req.user!.uid),
    });
  },
);

export default router;
