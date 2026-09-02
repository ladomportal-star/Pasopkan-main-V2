import { Router } from "express";

const router = Router();

// Health Check Endpoint
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    app: "Pasopkan API",
    timestamp: new Date().toISOString(),
  });
});

export default router;
