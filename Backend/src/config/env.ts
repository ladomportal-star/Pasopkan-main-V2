import "dotenv/config";
import { z } from "zod";

/**
 * Parse + validate every environment variable once, at boot.
 * Import `env` from here instead of touching `process.env` directly.
 */

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

  FIREBASE_PROJECT_ID: z.string().optional().default(""),
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

  firebaseProjectId: e.FIREBASE_PROJECT_ID,
  frontendDist: e.FRONTEND_DIST,

  rateLimit: { windowMs: e.RATE_LIMIT_WINDOW_MS, max: e.RATE_LIMIT_MAX },
} as const;

/** Warn (don't crash) about config a production deployment really wants. */
export function checkEnv(warn: (msg: string) => void) {
  if (!env.databaseUrl && !env.sql.host) {
    warn("No DATABASE_URL / SQL_* set — ticket & review APIs use in-memory fallback.");
  }
  if (!env.firebaseProjectId) {
    warn("FIREBASE_PROJECT_ID not set — ID-token verification is disabled (dev fallback).");
  }
}
