import http from "node:http";
import { exportJWK, generateKeyPair, SignJWT, type JWK } from "jose";

/**
 * A stand-in Supabase Auth: serves a real JWKS over HTTP and signs real ES256
 * access tokens, so the API's verification path (signature, issuer, audience,
 * expiry) is exercised exactly as in production — nothing is bypassed.
 */
const { publicKey, privateKey } = await generateKeyPair("ES256");
const jwk: JWK = { ...(await exportJWK(publicKey)), alg: "ES256", use: "sig", kid: "test-key" };

// A second, unrelated key: tokens signed with it must be rejected.
const other = await generateKeyPair("ES256");

let baseUrl = "";

export async function startAuthServer() {
  const server = http.createServer((req, res) => {
    if (req.url === "/auth/v1/.well-known/jwks.json") {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ keys: [jwk] }));
    } else {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as { port: number };
  baseUrl = `http://127.0.0.1:${port}`;
  process.env.SUPABASE_URL = baseUrl;
  return server;
}

export interface TokenOptions {
  sub?: string;
  email?: string;
  anonymous?: boolean;
  issuer?: string;
  audience?: string;
  expiresIn?: string;
  /** Sign with a key the server doesn't know about. */
  wrongKey?: boolean;
}

export async function tokenFor(sub: string, opts: TokenOptions = {}) {
  return new SignJWT({
    email: opts.anonymous ? undefined : (opts.email ?? `${sub}@test.local`),
    is_anonymous: opts.anonymous ?? false,
    role: "authenticated",
  })
    .setProtectedHeader({ alg: "ES256", kid: "test-key" })
    .setSubject(sub)
    .setIssuer(opts.issuer ?? `${baseUrl}/auth/v1`)
    .setAudience(opts.audience ?? "authenticated")
    .setIssuedAt()
    .setExpirationTime(opts.expiresIn ?? "1h")
    .sign(opts.wrongKey ? other.privateKey : privateKey);
}

/** `{ Authorization: "Bearer <jwt>" }` for a user. */
export const as = async (sub: string, opts?: TokenOptions) => ({
  Authorization: `Bearer ${await tokenFor(sub, opts)}`,
});
