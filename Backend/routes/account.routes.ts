import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.ts";
import { getOrCreateUser } from "../db/users.ts";

const router = Router();

// Synchronize authenticated user profile
router.post("/account/sync", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { email } = req.body;
    const uid = req.user?.uid;
    if (!uid || !email) {
      return res.status(400).json({ error: "Missing uid or email" });
    }

    const user = await getOrCreateUser(uid, email);
    return res.json({ success: true, user });
  } catch (error: any) {
    console.error("[Account Route] Sync user error:", error);
    return res.status(500).json({ error: error.message || "Failed to synchronize user account" });
  }
});

export default router;
