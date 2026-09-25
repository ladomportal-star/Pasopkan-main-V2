import { pino, type Logger } from "pino";
import pretty from "pino-pretty";
import { env } from "../config/env.ts";

// JSON in production; pretty & colourised in dev; silent in tests
// (override with LOG_LEVEL). pino-pretty is wired as a plain stream rather
// than pino's worker-thread `transport` option, which fails to resolve
// "pino-pretty" once this file is loaded through a bundler's module graph.
//
// `logger` accepts both console-style (`logger.info("msg", value)`) and
// pino-native (`logger.error({ err }, "msg")`) calls; `logger.raw` is the
// underlying pino instance (e.g. for pino-http).
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
