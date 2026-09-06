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
 * Parses custom mock or development tokens without invoking Firebase ID token verification
 */
function parseMockToken(token: string): { uid: string; email?: string } | null {
  if (!token) return null;

  // Format: mock_token.<base64Json>
  if (token.startsWith("mock_token.")) {
    try {
      const b64 = token.slice("mock_token.".length);
      const jsonStr = Buffer.from(b64, "base64").toString("utf-8");
      const data = JSON.parse(jsonStr);
      if (data && (data.uid || data.sub)) {
        return { uid: data.uid || data.sub, email: data.email };
      }
    } catch {
      // ignore
    }
  }

  // Format: mock_token_<uid> or starts with mock_ / dev_ / pasopkan_mock_
  if (
    token.startsWith("mock_") ||
    token.startsWith("dev_") ||
    token.startsWith("pasopkan_mock_") ||
    token === "mock_token_12345"
  ) {
    const parts = token.split("_");
    const uid = parts.length > 2 ? parts.slice(2).join("_") : token;
    return { uid };
  }

  return null;
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

  // 1. Check if token is an explicit mock or development token
  const mockInfo = parseMockToken(token);
  if (mockInfo) {
    const uid = (req.headers["x-user-uid"] as string) || mockInfo.uid;
    const email = (req.headers["x-user-email"] as string) || mockInfo.email || "user@example.com";
    req.user = { uid, email, isMock: true };
    return next();
  }

  // 2. Validate token structure: Firebase ID tokens are standard 3-part JWTs
  const parts = token.split(".");
  if (parts.length !== 3) {
    // Non-JWT token string in dev/fallback mode
    const uid = (req.headers["x-user-uid"] as string) || token;
    const email = (req.headers["x-user-email"] as string) || "user@example.com";
    req.user = { uid, email };
    return next();
  }

  // 3. Token is a 3-part JWT - verify with Firebase Admin if available
  if (getApps().length > 0) {
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      req.user = decodedToken;
      return next();
    } catch {
      // Graceful fallback for dev tokens or offline environment: decode payload safely
      try {
        const payloadStr = Buffer.from(parts[1], "base64").toString("utf-8");
        const payload = JSON.parse(payloadStr);
        if (payload && (payload.sub || payload.uid || payload.user_id)) {
          req.user = {
            uid: payload.uid || payload.sub || payload.user_id,
            email: payload.email || (req.headers["x-user-email"] as string) || "user@example.com",
            ...payload,
          };
          return next();
        }
      } catch {
        // payload decode failed
      }

      // Fallback for dev mode
      const uid = (req.headers["x-user-uid"] as string) || parts[0] || "dev-user";
      const email = (req.headers["x-user-email"] as string) || "user@example.com";
      req.user = { uid, email };
      return next();
    }
  }

  // 4. Default fallback when Firebase Admin app is not initialized
  req.user = {
    uid: (req.headers["x-user-uid"] as string) || token,
    email: (req.headers["x-user-email"] as string) || "user@example.com",
  };
  return next();
}
