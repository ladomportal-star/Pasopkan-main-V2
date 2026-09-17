import fs from "node:fs";
import path from "node:path";
import express from "express";
import { createServer as createViteServer } from "vite";
import { checkEnv } from "./src/config/env.ts";
import { createApp } from "./src/app.ts";
import { logger } from "./src/utils/logger.ts";

async function startServer() {
  checkEnv((msg) => logger.warn("[env]", msg));

  const app = createApp();
  const PORT = 3000;

  // Vite middleware for development (handles frontend routing, HMR, and asset bundling)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: path.resolve(process.cwd(), "frontend"),
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true",
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = fs.existsSync(path.resolve(process.cwd(), "dist"))
      ? path.resolve(process.cwd(), "dist")
      : process.cwd();
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Pasopkan server running on http://0.0.0.0:${PORT} (mode: ${process.env.NODE_ENV || "development"})`);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      logger.error(`Port ${PORT} is already in use.`);
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
}

startServer();

