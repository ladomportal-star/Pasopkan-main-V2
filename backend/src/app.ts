import "express-async-errors"; // Express 4 does not catch rejected async handlers on its own
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { rateLimit } from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.ts";
import apiRouter from "./routes/index.ts";
import { notFound, errorHandler } from "./middlewares/error.middleware.ts";
import { logger } from "./utils/logger.ts";

/** Build and configure the Express application. */
export function createApp() {
  const app = express();
  app.set("trust proxy", 1); // behind a load balancer / Supabase / Nginx

  // Per-request structured logging (applied only to API routes)
  if (!env.isTest) {
    app.use(
      "/api",
      pinoHttp({
        logger: logger.raw,
        // Keep dev logs terse; full detail is still in the JSON fields in prod.
        serializers: {
          req: (req) => ({ id: req.id, method: req.method, url: req.url }),
          res: (res) => ({ statusCode: res.statusCode }),
        },
        autoLogging: { ignore: (req) => req.url === "/health" || req.url === "/api/health" },
      }),
    );
  }

  // Security + transport
  // This process only ever serves JSON under /api (see below) — it never
  // renders HTML — so Helmet's full default header set (CSP, frameguard,
  // HSTS, cross-origin isolation, ...) applies with no compatibility cost.
  app.use(helmet());

  // Cross-origin access is opt-in via CORS_ORIGIN. In development, an empty
  // list reflects any origin for convenience; in production it must be set
  // explicitly (checkEnv warns at boot otherwise) — reflecting `true` with
  // `credentials: true` would let any website read authenticated responses.
  app.use(
    cors({
      origin: env.corsOrigins.length > 0 ? env.corsOrigins : !env.isProd,
      credentials: true,
    }),
  );

  // Compress API responses
  app.use("/api", compression());

  // Basic abuse protection on the API surface
  app.use(
    "/api",
    rateLimit({
      windowMs: env.rateLimit.windowMs,
      limit: env.rateLimit.max,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    }),
  );

  app.use("/api", express.json({ limit: "10mb" }));
  app.use("/api", express.urlencoded({ extended: true, limit: "10mb" }));

  // API
  app.use("/api", apiRouter);
  app.use("/api", notFound);
  app.use("/api", errorHandler);

  return app;
}
