import { Router, type Request, type Response } from "express";
import express from "express";
import { deliverSmsHook, SmsHookError } from "../services/sms-hook.service.ts";
import { logger } from "../utils/logger.ts";

const router = Router();

// Mount BEFORE express.json(): Standard Webhooks signs exact raw bytes.
router.post(
  "/auth-hooks/send-sms",
  express.raw({ type: "application/json", limit: "32kb" }),
  async (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    if (!Buffer.isBuffer(req.body)) {
      return res.status(415).json({ error: { http_code: 415, message: "JSON body required" } });
    }
    try {
      await deliverSmsHook(req.body, {
        id: req.header("webhook-id"),
        timestamp: req.header("webhook-timestamp"),
        signature: req.header("webhook-signature"),
      });
      return res.status(200).end();
    } catch (error) {
      const status = error instanceof SmsHookError ? error.status : 503;
      const message = error instanceof SmsHookError ? error.message : "SMS delivery unavailable";
      if (!(error instanceof SmsHookError))
        logger.error("SMS hook failed without provider details");
      return res.status(status).json({ error: { http_code: status, message } });
    }
  },
);

export default router;
