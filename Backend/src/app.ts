import fs from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";
import { env } from "./config/env.ts";
import apiRouter from "./routes/index.ts";
import { notFound, errorHandler } from "./middlewares/error.middleware.ts";
import { logger } from "./utils/logger.ts";

/** Build and configure the Express application. */
export function createApp() {
  const app = express();

  // CORS — allow the configured frontend origin(s); empty list reflects any.
  app.use(
    cors({
      origin: env.corsOrigins.length > 0 ? env.corsOrigins : true,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // API
  app.use("/api", apiRouter);
  app.use("/api", notFound);

  // Optionally serve the built frontend from this same process
  const distPath = env.frontendDist
    ? path.resolve(env.frontendDist)
    : path.resolve(process.cwd(), "..", "Frontend", "dist");
  if (env.isProd && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
    logger.info("[app] serving frontend from", distPath);
  }

  // Centralized error handler — must be last
  app.use(errorHandler);

  return app;
}
