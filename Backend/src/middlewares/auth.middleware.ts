import type { Request, Response, NextFunction } from "express";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps } from "firebase-admin/app";
import { env } from "../config/env.ts";
import { logger } from "../utils/logger.ts";

/**
 * Authentication = Firebase ID token verification.
 *
 * Sign-in happens entirely on the client against Firebase Auth, which
 * returns an **ID token — an RS256-signed JWT**. This service never sees a
 * password, so there is no credential here to store or hash.
 *
 * `verifyIdToken` checks the JWT signature against Google's published
 * public keys and validates `aud` (our project), `iss` and expiry. That
 * works from `projectId` alone — a service account is only needed for
 * extras such as revocation checks.
 *
 * AUTH_DEV_BYPASS=true skips verification and trusts the bearer string as
 * the uid. Local development and tests only; `config/env.ts` refuses to
 * boot with it enabled while NODE_ENV=production.
 */
function initFirebaseAdmin() {
  if (getApps().length > 0) return;
  if (!env.firebaseProjectId) {
    logger.warn("[auth] FIREBASE_PROJECT_ID not set — cannot verify ID tokens.");
    return;
  }
  try {
    initializeApp({ projectId: env.firebaseProjectId });
    logger.info("[auth] Firebase Admin initialized for project:", env.firebaseProjectId);
  } catch (e: any) {
    logger.error("[auth] Firebase Admin init failed:", e?.message);
  }
}

initFirebaseAdmin();

const unauthorized = (res: Response, message: string) => res.status(401).json({ error: message });

/** Reject the request unless it carries a valid Firebase ID token. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return unauthorized(res, "Missing or invalid authorization header");
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) return unauthorized(res, "Empty token provided");

  // Explicit, non-production escape hatch for local dev and tests.
  if (env.authDevBypass) {
    req.user = {
      uid: token,
      email: (req.headers["x-user-email"] as string) || "dev@example.com",
    };
    return next();
  }

  if (getApps().length === 0) {
    logger.error("[auth] Firebase Admin unavailable — refusing authenticated request");
    return res.status(503).json({ error: "Authentication is not configured on this server" });
  }

  try {
    req.user = await getAuth().verifyIdToken(token);
    return next();
  } catch (error: any) {
    logger.warn(`[auth] ID token rejected: ${error?.code ?? error?.message}`);
    return unauthorized(res, "Invalid or expired ID token");
  }
}
