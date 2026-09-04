import { pino, type Logger } from "pino";
import { env } from "../config/env.ts";

/**
 * Application logger. JSON in production; pretty & colourised in dev; silent
 * in tests (override with LOG_LEVEL).
 *
 * `logger` accepts both styles:
 *   logger.info("plain", value)            // console-style, args are joined
 *   logger.error({ err }, "message")       // pino-native (structured)
 * Use `logger.raw` for the underlying pino instance (e.g. pino-http).
 */
export const raw: Logger = pino({
  level: process.env.LOG_LEVEL ?? (env.isTest ? "silent" : env.isProd ? "info" : "debug"),
  ...(env.isProd
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" },
        },
      }),
});

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
