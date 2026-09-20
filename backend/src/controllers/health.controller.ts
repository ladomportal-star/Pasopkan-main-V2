import type { Request, Response } from "express";
import { ok } from "../utils/response.util.ts";
import { pool } from "../config/database.ts";

export async function getHealth(_req: Request, res: Response) {
  const startedAt = Date.now();
  let database: "connected" | "disconnected" = "disconnected";

  try {
    await pool.query("select 1");
    database = "connected";
  } catch {
    // swallow — reported via the `database` field below, health check itself never throws
  }

  ok(res, {
    status: "ok",
    app: "Pasopkan API",
    database,
    databaseLatencyMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  });
}
