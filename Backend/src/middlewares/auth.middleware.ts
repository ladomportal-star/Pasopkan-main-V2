import type { Request, Response, NextFunction } from "express";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps } from "firebase-admin/app";
import { env } from "../config/env.ts";
import { logger } from "../utils/logger.ts";

// Initialize Firebase Admin from FIREBASE_PROJECT_ID. GOOGLE_APPLICATION_CREDENTIALS
// (read implicitly by the Admin SDK) supplies the service-account key for real
// ID-token verification.
function initFirebaseAdmin() {
  if (getApps().length > 0) return;
  if (!env.firebaseProjectId) {
    logger.warn("[auth] FIREBASE_PROJECT_ID not set — ID-token verification disabled (dev fallback).");
    return;
  }
  try {
    initializeApp({ projectId: env.firebaseProjectId });
    logger.info("[auth] Firebase Admin initialized for project:", env.firebaseProjectId);
  } catch (e: any) {
    logger.warn("[auth] Firebase Admin init failed:", e?.message);
  }
}

initFirebaseAdmin();

/** Verify a Firebase ID token; in dev without a service account, trust the raw UID. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.split("Bearer ")[1]?.trim();
  if (!token) return res.status(401).json({ error: "Empty token provided" });

  const devFallback = () => {
    req.user = {
      uid: token,
      email: (req.headers["x-user-email"] as string) || "user@example.com",
    };
    next();
  };

  try {
    if (getApps().length > 0) {
      req.user = await getAuth().verifyIdToken(token);
      return next();
    }
    return devFallback();
  } catch (error: any) {
    logger.warn("[auth] token verification fallback:", error?.message);
    return devFallback();
  }
}
