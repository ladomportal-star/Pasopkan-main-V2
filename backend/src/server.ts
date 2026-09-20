import { env, checkEnv } from "./config/env.ts";
import { createApp } from "./app.ts";
import { logger } from "./utils/logger.ts";
import { pool } from "./config/database.ts";
import { releaseExpiredOrders } from "./services/ticket.service.ts";
import { printStartupBanner } from "./utils/startupBanner.ts";

checkEnv((msg) => logger.warn("[env]", msg));

const app = createApp();
const startedAt = Date.now();

const server = app.listen(env.port, env.host, async () => {
  let database: { ok: boolean; detail: string };

  if (env.databaseUrl || env.sql.host) {
    const dbStartedAt = Date.now();
    try {
      await pool.query("select 1");
      database = { ok: true, detail: `(${Date.now() - dbStartedAt}ms)` };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      database = { ok: false, detail: message };
      logger.error(`[Database] connection failed: ${message}`);
    }
  } else {
    database = { ok: false, detail: "not configured - running without a database" };
  }

  printStartupBanner({
    url: `http://localhost:${env.port}`,
    mode: env.nodeEnv,
    readyMs: Date.now() - startedAt,
    database,
    auth: env.supabaseUrl
      ? { ok: true, detail: new URL(env.supabaseUrl).hostname }
      : { ok: false, detail: "SUPABASE_URL not set - authenticated endpoints return 503" },
  });
});

// Reservations that never got paid must not hold stock forever.
const sweep = setInterval(
  () =>
    releaseExpiredOrders().catch((err) =>
      logger.error("[tickets] expiring stale orders failed:", err.message),
    ),
  5 * 60 * 1000,
);
sweep.unref();

// Listen-time errors (e.g. port already taken) - clear message, clean exit
server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    logger.error(
      `Port ${env.port} is already in use. Stop the other process, ` +
        `or start on another port:  PORT=3001 npm run dev`,
    );
  } else {
    logger.error("Failed to start server:", err.message);
  }
  process.exit(1);
});

// Graceful shutdown
function shutdown(signal: string) {
  logger.info(`${signal} received - shutting down...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => logger.warn("unhandledRejection:", reason));
process.on("uncaughtException", (error) => logger.error("uncaughtException:", error));
