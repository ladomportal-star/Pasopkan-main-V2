import { pino, type Logger } from "pino";
import pretty from "pino-pretty";
import { env } from "../config/env.ts";

/**
 * Application logger. JSON in production; pretty & colourised in dev; silent
 * in tests (override with LOG_LEVEL).
 *
 * Quiet by default ("info" — request/lifecycle noise stays out of the way);
 * set LOG_LEVEL=debug to see per-request detail and wiring diagnostics.
 *
 * pino-pretty is wired in as a plain writable stream (not pino's
 * worker-thread `transport` option) — the transport option resolves
 * "pino-pretty" via a worker thread's own module lookup, which fails
 * with "unable to determine transport target" once this file is loaded
 * through a bundler's module graph (e.g. Vite's dev-server middleware).
 * A stream has no such lookup, so it works the same way under tsx and Vite.
 *
 * `logger` accepts both styles:
 *   logger.info("plain", value)            // console-style, args are joined
 *   logger.error({ err }, "message")       // pino-native (structured)
 * Use `logger.raw` for the underlying pino instance (e.g. pino-http).
 */
const prettyInDev = !env.isProd && !env.isTest;

const options = { level: process.env.LOG_LEVEL ?? (env.isTest ? "silent" : "info") };

export const raw: Logger = prettyInDev
  ? pino(options, pretty({ colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" }))
  : pino(options);

type Level = "debug" | "info" | "warn" | "error";

const join = (args: unknown[]) =>
  args
    .map((a) =>
      typeof a === "string"
        ? a
        : a instanceof Error
          ? a.stack || a.message
          : (() => {
              try {
                return JSON.stringify(a);
              } catch {
                return String(a);
              }
            })(),
    )
    .join(" ");

const at =
  (level: Level) =>
  (...args: unknown[]) => {
    if (
      args.length >= 2 &&
      typeof args[0] === "object" &&
      args[0] !== null &&
      typeof args[1] === "string"
    ) {
      raw[level](args[0] as object, args[1] as string);
    } else {
      raw[level](join(args));
    }
  };

export const logger = {
  raw,
  debug: at("debug"),
  info: at("info"),
  warn: at("warn"),
  error: at("error"),
};
