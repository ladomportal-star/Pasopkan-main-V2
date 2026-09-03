import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.ts';

/**
 * Build a pg Pool from either:
 *   1. DATABASE_URL  — a single connection string (this is what Supabase gives you)
 *   2. the discrete SQL_* variables (local Postgres / other hosts)
 *
 * Supabase (Project Settings -> Database -> Connection string -> "URI"):
 *   - "Session pooler"  ...pooler.supabase.com:5432   ← use this for a long-lived server
 *   - "Direct connection"  db.<ref>.supabase.co:5432  ← use this for migrations
 *   - "Transaction pooler" ...:6543                    ← serverless only, avoid here
 * Every Supabase connection needs SSL; keep the `?sslmode=require` suffix.
 */
const connectionString = process.env.DATABASE_URL?.trim();

const isLocal = (target: string) => /@(localhost|127\.0\.0\.1|::1)[:/]/.test(target) || /\b(localhost|127\.0\.0\.1)\b/.test(target);

const wantSsl =
  process.env.DATABASE_SSL === 'true' ||
  (!!connectionString && !isLocal(connectionString) && !/sslmode=disable/.test(connectionString));

export const createPool = () => {
  if (connectionString) {
    return new Pool({
      connectionString,
      ssl: wantSsl ? { rejectUnauthorized: false } : undefined,
      max: Number(process.env.DATABASE_POOL_MAX) || 10,
      connectionTimeoutMillis: 15000,
    });
  }

  return new Pool({
    host: process.env.SQL_HOST,
    port: Number(process.env.SQL_PORT) || 5432,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.DATABASE_POOL_MAX) || 10,
    connectionTimeoutMillis: 15000,
  });
};

const pool = createPool();

// Prevent unhandled pool-level errors from crashing the application
pool.on('error', (err) => {
  console.error('[Database Pool Error]:', err);
});

// Initialize Drizzle with the pool and schema
export const db = drizzle(pool, { schema });
export { schema };
