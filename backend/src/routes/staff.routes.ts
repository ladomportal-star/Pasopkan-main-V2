import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRegisteredUser } from "../middlewares/auth.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import { assignEventStaff, listEventStaff, revokeEventStaff } from "../services/staff.service.ts";

const router = Router();
const eventParams = z.object({ id: z.string().uuid() });
const memberParams = z.object({ id: z.string().uuid(), userId: z.string().uuid() });

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
    body: z.object({ email: z.email().trim().toLowerCase() }),
  }),
  async (req, res) => {
    res
      .status(201)
      .json({ staff: await assignEventStaff(req.params.id, req.body.email, req.user!.uid) });
  },
);

router.delete(
  "/events/:id/staff/:userId",
  requireAuth,
  requireRegisteredUser,
  validate({ params: memberParams }),
  async (req, res) => {
    res.json({ staff: await revokeEventStaff(req.params.id, req.params.userId, req.user!.uid) });
  },
);

export default router;
