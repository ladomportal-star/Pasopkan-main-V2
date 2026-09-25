import type { Request, Response, NextFunction } from "express";
import { z, type ZodType } from "zod";

interface Schemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

export function validate(schemas: Schemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const key of ["body", "query", "params"] as const) {
      const schema = schemas[key];
      if (!schema) continue;
      const result = schema.safeParse(req[key]);
      if (!result.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: z.flattenError(result.error).fieldErrors,
        });
      }
      // req.query / req.params getters are read-only in Express 5; mutate in place.
      Object.assign(req[key] as Record<string, unknown>, result.data);
    }
    next();
  };
}
