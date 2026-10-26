import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

// Parse + validate every environment variable once, at boot.
// Import `env` from here instead of touching `process.env` directly.
// Loaded by explicit path (not plain `dotenv/config`) so Backend/.env is
// found regardless of the process's cwd.
const moduleDir = fileURLToPath(new URL(".", import.meta.url));
const backendDir = path.resolve(
  moduleDir,
  path.basename(moduleDir.replace(/[\\/]$/, "")) === "dist" ? ".." : "../..",
);
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
  // Least-privilege key used for public Auth operations proxied by this API.
  // Accepts either the current sb_publishable_* key or the legacy anon JWT.
  SUPABASE_PUBLISHABLE_KEY: z.string().trim().optional().default(""),
  // Existing deployments may still use the legacy variable name.
  SUPABASE_ANON_KEY: z.string().trim().optional().default(""),
  // Service role key: full admin access, bypasses RLS. SECRET — never expose
  // to the frontend or commit it. Used by the media storage service.
  SUPABASE_SECRET_KEY: z.string().trim().optional().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().trim().optional().default(""),

  // Supabase Send SMS HTTP hook -> Wenova. Secrets are server-only.
  SUPABASE_SEND_SMS_HOOK_SECRET: z.string().trim().optional().default(""),
  WENOVA_SMS_TOKEN: z.string().trim().optional().default(""),
  WENOVA_SMS_SCRIPT_ID: z.string().trim().optional().default(""),
  WENOVA_SMS_HEADER: z.string().trim().optional().default(""),
  WENOVA_SMS_API_URL: z.string().url().default("https://apimicroservices.wenova.fun/sms/package"),

  // Payment credentials are server-only. A provider adapter must also be
  // implemented and explicitly registered before any live payment is enabled.
  PAYMENT_PROVIDER: z
    .string()
    .trim()
    .regex(/^[a-z0-9_-]*$/i)
    .optional()
    .default(""),
  PAYMENT_API_BASE_URL: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((value) => {
      if (!value) return true;
      try {
        return new URL(value).protocol === "https:";
      } catch {
        return false;
      }
    }, "Payment API URL must be a valid HTTPS URL"),
  PAYMENT_API_KEY: z.string().trim().optional().default(""),
  PAYMENT_MERCHANT_ID: z.string().trim().optional().default(""),
  PAYMENT_WEBHOOK_SECRET: z.string().trim().optional().default(""),
  PHAJAY_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),
  // PhaJay Split Payment is configured in the merchant portal for approved
  // sub-accounts; there is no public transfer endpoint in the provider docs.
  PHAJAY_PAYOUT_MODE: z.enum(["manual", "split_payment"]).default("manual"),

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
  supabasePublishableKey: e.SUPABASE_PUBLISHABLE_KEY || e.SUPABASE_ANON_KEY,
  // Prefer Supabase's current server-only secret key. Keep the legacy name as
  // a migration fallback for existing deployments.
  supabaseAdminKey: e.SUPABASE_SECRET_KEY || e.SUPABASE_SERVICE_ROLE_KEY,
  smsHook: {
    secret: e.SUPABASE_SEND_SMS_HOOK_SECRET,
    wenovaToken: e.WENOVA_SMS_TOKEN,
    wenovaScriptId: e.WENOVA_SMS_SCRIPT_ID,
    header: e.WENOVA_SMS_HEADER,
    apiUrl: e.WENOVA_SMS_API_URL,
  },
  payment: {
    provider: e.PAYMENT_PROVIDER,
    apiBaseUrl: e.PAYMENT_API_BASE_URL,
    apiKey: e.PAYMENT_API_KEY,
    merchantId: e.PAYMENT_MERCHANT_ID,
    // PhaJay signs callbacks with the same secretKey/devSecretKey used by its
    // API. Keep an override for a controlled key-rotation window.
    webhookSecret: e.PAYMENT_WEBHOOK_SECRET || e.PAYMENT_API_KEY,
    environment: e.PHAJAY_ENVIRONMENT,
    payoutMode: e.PHAJAY_PAYOUT_MODE,
    get credentialsComplete() {
      if (this.provider === "phajay") return Boolean(this.apiBaseUrl && this.apiKey);
      return Boolean(
        this.provider && this.apiBaseUrl && this.apiKey && this.merchantId && this.webhookSecret,
      );
    },
  },
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
  if (!env.supabaseAdminKey) {
    warn("SUPABASE_SECRET_KEY not set - verified-phone and media endpoints will return 503.");
  }
  if (!env.supabasePublishableKey) {
    warn("SUPABASE_PUBLISHABLE_KEY not set - phone OTP endpoints will return 503.");
  }
  if (
    env.smsHook.secret &&
    (!env.smsHook.header || (!env.smsHook.wenovaToken && !env.smsHook.wenovaScriptId))
  ) {
    warn("Send SMS hook is only partially configured - Wenova delivery will return 503.");
  }
  const paymentCredentialCount = [
    env.payment.provider,
    env.payment.apiBaseUrl,
    env.payment.apiKey,
    ...(env.payment.provider === "phajay" ? [] : [env.payment.merchantId]),
    ...(env.payment.provider === "phajay" ? [] : [env.payment.webhookSecret]),
  ].filter(Boolean).length;
  if (paymentCredentialCount > 0 && !env.payment.credentialsComplete) {
    warn(
      "Payment gateway configuration is incomplete - live checkout and refunds remain disabled.",
    );
  }
  if (!env.payment.credentialsComplete) {
    warn("Payment gateway is not configured - live checkout and refunds remain disabled.");
  }
  if (env.isProd && env.corsOrigins.length === 0) {
    warn("CORS_ORIGIN not set in production - all cross-origin browser requests will be blocked.");
  }
}
