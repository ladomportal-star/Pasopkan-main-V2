import type { Request, Response } from "express";
import { ok } from "../utils/response.util.ts";

export function getHealth(_req: Request, res: Response) {
  ok(res, { status: "ok", app: "Pasopkan API", timestamp: new Date().toISOString() });
}
