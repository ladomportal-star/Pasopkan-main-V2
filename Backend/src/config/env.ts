import "dotenv/config";

/**
 * Single, typed view of every environment variable the API reads.
 * Import `env` from here instead of touching `process.env` directly.
 */

const bool = (v: string | undefined) => v === "true" || v === "1";
const list = (v: string | undefined) =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  get isProd() {
    return this.nodeEnv === "production";
  },

  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || "0.0.0.0",
  corsOrigins: list(process.env.CORS_ORIGIN),

  // Database — prefer DATABASE_URL, fall back to discrete SQL_* vars
  databaseUrl: process.env.DATABASE_URL?.trim() || "",
  databasePoolMax: Number(process.env.DATABASE_POOL_MAX) || 10,
  databaseForceSsl: bool(process.env.DATABASE_SSL),
  sql: {
    host: process.env.SQL_HOST || "",
    port: Number(process.env.SQL_PORT) || 5432,
    database: process.env.SQL_DB_NAME || "",
    user: process.env.SQL_USER || "",
    password: process.env.SQL_PASSWORD || "",
  },

  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "",

  // Optional: serve Frontend/dist from this process
  frontendDist: process.env.FRONTEND_DIST || "",
} as const;

/** Warn (don't crash) about config that a production deployment really wants. */
export function checkEnv(warn: (msg: string) => void) {
  if (!env.databaseUrl && !env.sql.host) {
    warn("No DATABASE_URL / SQL_* set — ticket & review APIs use in-memory fallback.");
  }
  if (!env.firebaseProjectId) {
    warn("FIREBASE_PROJECT_ID not set — ID-token verification is disabled (dev fallback).");
  }
}
