import type { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env.ts";
import { logger } from "../utils/logger.ts";

/**
 * Authentication = verification of the Supabase Auth access token the
 * frontend signs users in with. Tokens are checked against the project's
 * public JWKS (signature, issuer, audience, expiry) — there is no shared
 * secret, no mock token, and no "trust the bearer string" escape hatch.
 */
type AuthUser = NonNullable<Request["user"]>;

const issuer = env.supabaseUrl ? `${env.supabaseUrl}/auth/v1` : "";
const jwks = issuer ? createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`)) : null;

/** Failures that mean "this token is no good" (401), not "we couldn't check" (503). */
const isBadToken = (err: unknown) => {
  const code = (err as { code?: string })?.code ?? "";
  return /^ERR_(JWT|JWS|JWK|JOSE)/.test(code) && code !== "ERR_JWKS_TIMEOUT";
};

async function verify(token: string): Promise<AuthUser> {
  const { payload } = await jwtVerify(token, jwks!, { issuer, audience: "authenticated" });
  if (!payload.sub)
    throw Object.assign(new Error("Token has no subject"), { code: "ERR_JWT_INVALID" });
  return {
    uid: payload.sub,
    email: typeof payload.email === "string" && payload.email ? payload.email : undefined,
    isAnonymous: payload.is_anonymous === true,
  };
}

const bearer = (req: Request) => {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : null;
};

/** Resolve the caller from the request, or answer the request and return null. */
async function authenticate(req: Request, res: Response, token: string): Promise<AuthUser | null> {
  if (!jwks) {
    res.status(503).json({ error: "Authentication is not configured on the server" });
    return null;
  }
  try {
    return await verify(token);
  } catch (err) {
    if (isBadToken(err)) {
      res.status(401).json({ error: "Invalid or expired token" });
    } else {
      logger.error("[auth] could not verify token:", err instanceof Error ? err.message : err);
      res.status(503).json({ error: "Authentication service unavailable" });
    }
    return null;
  }
}

/** Require a valid access token; attaches `req.user`. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = bearer(req);
  if (!token) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }
  const user = await authenticate(req, res, token);
  if (!user) return;
  req.user = user;
  next();
}

/** Attach `req.user` when a valid token is sent; anonymous callers pass through.
 *  A token that is present but invalid is still rejected. */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = bearer(req);
  if (!token) return next();
  const user = await authenticate(req, res, token);
  if (!user) return;
  req.user = user;
  next();
}

/** Guest (anonymous sign-in) sessions may browse, but not act as an account holder. */
export function requireRegisteredUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.isAnonymous) {
    return res.status(403).json({ error: "Sign in with an account to do this" });
  }
  next();
}
