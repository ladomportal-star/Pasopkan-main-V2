/** Barrel for the data layer: the Drizzle schema + the configured client. */
export * from "./schema.ts";
export * as schema from "./schema.ts";
export { db, pool } from "../config/database.ts";
