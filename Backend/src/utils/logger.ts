import { env } from "../config/env.ts";

/** Minimal leveled logger. Swap for pino/winston later without touching callers. */
const stamp = () => new Date().toISOString();

export const logger = {
  info: (...args: unknown[]) => console.log(`${stamp()} INFO `, ...args),
  warn: (...args: unknown[]) => console.warn(`${stamp()} WARN `, ...args),
  error: (...args: unknown[]) => console.error(`${stamp()} ERROR`, ...args),
  debug: (...args: unknown[]) => {
    if (!env.isProd) console.debug(`${stamp()} DEBUG`, ...args);
  },
};
