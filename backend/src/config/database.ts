import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import { env } from "./env.ts";
import { logger } from "../utils/logger.ts";
import * as schema from "../models/schema.ts";

const { Pool } = pkg;

// Supabase: use the "Session pooler" connection string (…pooler.supabase.com:5432),
// not "Direct connection" (IPv6-only on the free tier) or "Transaction pooler" (:6543, serverless only).
const isLocal = (target: string) =>
  /@(localhost|127\.0\.0\.1|::1)[:/]/.test(target) || /\b(localhost|127\.0\.0\.1)\b/.test(target);

const wantSsl =
  env.databaseForceSsl ||
  (!!env.databaseUrl && !isLocal(env.databaseUrl) && !/sslmode=disable/.test(env.databaseUrl));

function createPool() {
  if (env.databaseUrl) {
    return new Pool({
      connectionString: env.databaseUrl,
      ssl: wantSsl ? { rejectUnauthorized: false } : undefined,
      max: env.databasePoolMax,
      connectionTimeoutMillis: 15000,
    });
  }

  return new Pool({
    host: env.sql.host || undefined,
    port: env.sql.port,
    user: env.sql.user || undefined,
    password: env.sql.password || undefined,
    database: env.sql.database || undefined,
    ssl: env.databaseForceSsl ? { rejectUnauthorized: false } : undefined,
    max: env.databasePoolMax,
    connectionTimeoutMillis: 15000,
  });
}

export const pool = createPool();

// Pool-level errors must never crash the process
pool.on("error", (err) => {
  logger.error("[Database] pool error:", err.message);
});

export const db = drizzle(pool, { schema });
export { schema };
