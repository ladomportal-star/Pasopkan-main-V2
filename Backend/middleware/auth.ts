import { Request, Response, NextFunction } from "express";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps } from "firebase-admin/app";

// Initialize Firebase Admin from environment configuration.
// FIREBASE_PROJECT_ID identifies the project; GOOGLE_APPLICATION_CREDENTIALS
// (read implicitly by the Admin SDK) supplies the service-account key needed
// for real ID-token verification.
function initFirebaseAdmin() {
  if (getApps().length > 0) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    console.warn(
      "[Backend Auth] FIREBASE_PROJECT_ID not set — ID token verification disabled (dev fallback).",
    );
    return;
  }

  try {
    initializeApp({ projectId });
    console.log("[Backend Auth] Firebase Admin initialized for project:", projectId);
  } catch (e: any) {
    console.warn("[Backend Auth] Firebase Admin initialization failed:", e?.message);
  }
}

initFirebaseAdmin();

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    [key: string]: any;
  };
}

/**
 * Middleware to verify Firebase ID tokens or fallback to client token header
 */
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.split("Bearer ")[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: "Empty token provided" });
  }

  try {
    if (getApps().length > 0) {
      const decodedToken = await getAuth().verifyIdToken(token);
      req.user = decodedToken;
      return next();
    }
    
    // In dev / mock environments without admin cert
    req.user = { uid: token, email: req.headers["x-user-email"] as string || "user@example.com" };
    return next();
  } catch (error: any) {
    console.warn("[Backend Auth] Token verification fallback:", error?.message);
    req.user = { uid: token, email: req.headers["x-user-email"] as string || "user@example.com" };
    return next();
  }
}
