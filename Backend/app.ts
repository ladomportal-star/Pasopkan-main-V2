import express from "express";
import cors from "cors";
import apiRouter from "./routes/index.ts";

/**
 * Creates and configures the Express application for Pasopkan
 */
export function createPasopkanServer() {
  const app = express();

  // CORS — allow the frontend origin(s). CORS_ORIGIN is a comma-separated
  // list; when empty, any origin is reflected (convenient for local dev).
  const origins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  app.use(
    cors({
      origin: origins.length > 0 ? origins : true,
      credentials: true,
    }),
  );

  // Standard middlewares
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Mount all backend API routes under /api
  app.use("/api", apiRouter);

  return app;
}
