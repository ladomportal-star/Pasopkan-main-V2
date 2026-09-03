import { env, checkEnv } from "./config/env.ts";
import { createApp } from "./app.ts";
import { logger } from "./utils/logger.ts";

checkEnv((msg) => logger.warn("[env]", msg));

const app = createApp();
const server = app.listen(env.port, env.host, () => {
  logger.info(`Pasopkan API — running on http://localhost:${env.port}  (mode: ${env.nodeEnv})`);
});

// Listen-time errors (e.g. port already taken) — clear message, clean exit
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
  logger.info(`${signal} received — shutting down...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => logger.warn("unhandledRejection:", reason));
process.on("uncaughtException", (error) => logger.error("uncaughtException:", error));
