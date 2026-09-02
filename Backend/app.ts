import express from "express";
import apiRouter from "./routes/index.ts";

/**
 * Creates and configures the Express application for Pasopkan
 */
export function createPasopkanServer() {
  const app = express();

  // Standard middlewares
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Mount all backend API routes under /api
  app.use("/api", apiRouter);

  return app;
}
