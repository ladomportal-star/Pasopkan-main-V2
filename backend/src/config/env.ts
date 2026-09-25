import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

/**
 * Parse + validate every environment variable once, at boot.
 * Import `env` from here instead of touching `process.env` directly.
 *
 * `.env` is loaded by an explicit path next to this file's own location
 * (Backend/.env) rather than plain `dotenv/config`, which reads relative to
 * `process.cwd()` — that's Backend/ when run via `tsx` from here, but the
 * repo root when this module is loaded through the root Vite dev server
 * (vite.config.ts mounts the Backend app), where a cwd-relative lookup
 * would silently find no .env and boot with an unconfigured database.
 */
const backendDir = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");
dotenv.config({ path: path.join(backendDir, ".env") });

const list = (v?: string) =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  CORS_ORIGIN: z.string().optional(),

  DATABASE_URL: z.string().trim().optional().default(""),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
  DATABASE_SSL: z.string().optional().default("false"),
  SQL_HOST: z.string().optional().default(""),
  SQL_PORT: z.coerce.number().int().positive().default(5432),
  SQL_DB_NAME: z.string().optional().default(""),
  SQL_USER: z.string().optional().default(""),
  SQL_PASSWORD: z.string().optional().default(""),

  // Identity provider: the Supabase project the frontend signs users in with.
  // Access tokens are verified against its public JWKS (no shared secret).
  SUPABASE_URL: z.string().trim().optional().default(""),

  // OTP (api.otp.dev) — credentials live in the environment, never in source.
  OTP_API_KEY: z.string().trim().optional().default(""),
  OTP_SENDER_ID: z.string().trim().optional().default(""),
  OTP_TEMPLATE_ID: z.string().trim().optional().default(""),

  FRONTEND_DIST: z.string().optional().default(""),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Malformed values (not just missing) — fail loudly and early.
  console.error("Invalid environment configuration:\n", z.prettifyError(parsed.error));
  process.exit(1);
}
const e = parsed.data;

export const env = {
  nodeEnv: e.NODE_ENV,
  get isProd() {
    return this.nodeEnv === "production";
  },
  get isTest() {
    return this.nodeEnv === "test";
  },

  port: e.PORT,
  host: e.HOST,
  corsOrigins: list(e.CORS_ORIGIN),

  databaseUrl: e.DATABASE_URL,
  databasePoolMax: e.DATABASE_POOL_MAX,
  databaseForceSsl: e.DATABASE_SSL === "true" || e.DATABASE_SSL === "1",
  sql: {
    host: e.SQL_HOST,
    port: e.SQL_PORT,
    database: e.SQL_DB_NAME,
    user: e.SQL_USER,
    password: e.SQL_PASSWORD,
  },

  supabaseUrl: e.SUPABASE_URL.replace(/\/+$/, ""),
  otp: { apiKey: e.OTP_API_KEY, senderId: e.OTP_SENDER_ID, templateId: e.OTP_TEMPLATE_ID },
  frontendDist: e.FRONTEND_DIST,

  rateLimit: { windowMs: e.RATE_LIMIT_WINDOW_MS, max: e.RATE_LIMIT_MAX },
} as const;

// The API is database-backed end to end: there is no in-memory fallback, so
// booting without a database would only produce a server that fails every call.
// (Tests bring their own database — see tests/helpers/testDb.ts.)
if (!env.isTest && !env.databaseUrl && !env.sql.host) {
  console.error(
    "FATAL: no database configured. Set DATABASE_URL (or SQL_HOST/SQL_* ) in backend/.env.",
  );
  process.exit(1);
}

/** Warn (don't crash) about config the API needs for a specific feature. */
export function checkEnv(warn: (msg: string) => void) {
  if (!env.supabaseUrl) {
    warn("SUPABASE_URL not set - every authenticated endpoint will return 503.");
  }
  if (!env.otp.apiKey || !env.otp.senderId || !env.otp.templateId) {
    warn("OTP_API_KEY / OTP_SENDER_ID / OTP_TEMPLATE_ID not set - /api/otp/* will return 503.");
  }
  if (env.isProd && env.corsOrigins.length === 0) {
    warn("CORS_ORIGIN not set in production - all cross-origin browser requests will be blocked.");
  }
}
