import type { Request, Response } from "express";
import { pool } from "../config/database.ts";

export async function getHealth(_req: Request, res: Response) {
  const startedAt = Date.now();
  let database: "connected" | "disconnected" = "disconnected";

  try {
    await pool.query("select 1");
    database = "connected";
  } catch {
    // Report the dependency failure as an unavailable deployment. Railway only
    // promotes instances whose health check returns a successful status code.
  }

  const isReady = database === "connected";
  res.status(isReady ? 200 : 503).json({
    status: isReady ? "ok" : "unavailable",
    app: "Pasopkan API",
    database,
    databaseLatencyMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  });
}
