import { Router } from "express";
const router = Router();
router.post(["/otp/send", "/otp/verify"], (_req, res) => {
  res.status(503).json({ error: "Phone sign-in is not available. Please sign in with Google." });
});
export default router;
