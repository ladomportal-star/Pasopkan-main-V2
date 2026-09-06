import { env, checkEnv } from "./Backend/src/config/env.ts";
import { createApp } from "./Backend/src/app.ts";
import { logger } from "./Backend/src/utils/logger.ts";

checkEnv((msg) => logger.warn("[env]", msg));

const app = createApp();
const server = app.listen(env.port, "0.0.0.0", () => {
  logger.info(`Pasopkan running on http://0.0.0.0:${env.port} (mode: ${env.nodeEnv})`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    logger.error(`Port ${env.port} is already in use.`);
  } else {
    logger.error("Failed to start server:", err.message);
  }
  process.exit(1);
});

function shutdown(signal: string) {
  logger.info(`${signal} received — shutting down...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => logger.warn("unhandledRejection:", reason));
process.on("uncaughtException", (error) => logger.error("uncaughtException:", error));
