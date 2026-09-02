import { Request, Response, NextFunction } from "express";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Initialize Firebase Admin if configuration is present
function initFirebaseAdmin() {
  if (getApps().length > 0) return;

  const configPath = join(process.cwd(), "firebase-applet-config.json");
  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, "utf-8"));
      initializeApp({
        projectId: config.projectId,
      });
      console.log("[Backend Auth] Firebase Admin initialized for project:", config.projectId);
    } catch (e: any) {
      console.warn("[Backend Auth] Firebase Admin initialization failed:", e?.message);
    }
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
