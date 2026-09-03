import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import { createPasopkanServer } from "./app.ts";

const app = createPasopkanServer();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

// --- Optional: serve the built frontend from this same process ---
// Enable by pointing FRONTEND_DIST at Frontend/dist (or by building the
// frontend into ../Frontend/dist). Useful for single-container deploys.
const distPath = process.env.FRONTEND_DIST
  ? path.resolve(process.env.FRONTEND_DIST)
  : path.resolve(process.cwd(), "..", "Frontend", "dist");

if (process.env.NODE_ENV === "production" && fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  console.log(`[Pasopkan API] Serving frontend from ${distPath}`);
}

const server = app.listen(PORT, HOST, () => {
  console.log(`\n  ➜  Pasopkan API  —  server running on port: ${PORT}`);
  console.log(`     mode: ${process.env.NODE_ENV || "development"}\n`);
});

// Handle listen-time errors (e.g. port already taken) with a clear message
// instead of an unhandled "uncaughtException" stack dump.
server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `\n  ✖  Port ${PORT} is already in use.\n` +
        `     Another process (often a previous \`npm run dev\`) is still running on it.\n` +
        `     Stop that process, or start on another port:  PORT=3001 npm run dev\n`,
    );
  } else {
    console.error("\n  ✖  Failed to start server:", err.message, "\n");
  }
  process.exit(1);
});

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`\n[Pasopkan API] ${signal} received — shutting down...`);
  server.close(() => process.exit(0));
  // Force-exit if connections don't close in time
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.warn("[API Unhandled Rejection Caught Safely]:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[API Uncaught Exception Caught Safely]:", error);
});
