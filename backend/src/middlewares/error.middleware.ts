import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.ts";

/** Typed HTTP error: throw one from a service and the handler answers with its status. */
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Connection-level failures (database down / pool exhausted / network) -> 503. */
const isDatabaseUnavailable = (err: any) =>
  ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "ECONNRESET", "57P01", "53300"].includes(err?.code) ||
  /^08/.test(String(err?.code ?? "")) ||
  /connection (terminated|timeout)|timeout exceeded when trying to connect/i.test(
    String(err?.message ?? ""),
  );

/** 404 for anything that fell through the router. */
export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

/** Central error handler — keep it last in the middleware chain. */
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (isDatabaseUnavailable(err)) {
    logger.error("[error] database unavailable:", err?.message);
    return res.status(503).json({ error: "Database unavailable, please try again shortly" });
  }
  const status = Number(err?.status || err?.statusCode) || 500;
  if (status >= 500) {
    logger.error("[error]", err?.stack || err?.message || err);
    // Never leak internals of an unexpected failure to the client.
    return res.status(status).json({ error: "Internal server error" });
  }
  logger.warn("[error]", err?.message || err);
  res.status(status).json({ error: err?.message || "Request failed" });
}
