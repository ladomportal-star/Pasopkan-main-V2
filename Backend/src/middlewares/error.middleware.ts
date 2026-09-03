import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.ts";

/** 404 for anything that fell through the router. */
export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

/** Central error handler — keep it last in the middleware chain. */
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = Number(err?.status || err?.statusCode) || 500;
  if (status >= 500) logger.error("[error]", err?.stack || err?.message || err);
  else logger.warn("[error]", err?.message || err);
  res.status(status).json({ error: err?.message || "Internal server error" });
}
