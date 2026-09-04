import type { Response } from "express";

/** Send a success payload. Shape is passed through untouched so existing
 *  clients that expect `{ tickets }` / `{ reviews }` / `{ success }` keep working. */
export const ok = <T>(res: Response, body: T, status = 200) => res.status(status).json(body);

/** Send an error. */
export const fail = (res: Response, message: string, status = 400) =>
  res.status(status).json({ error: message });
