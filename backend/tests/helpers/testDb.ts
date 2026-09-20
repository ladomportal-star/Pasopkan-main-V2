import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "../../src/models/schema.ts";

/**
 * A real Postgres (PGlite, in-process WASM) with the project's real
 * migrations applied — so tests exercise the actual SQL, constraints and
 * transactions rather than a hand-rolled fake.
 */
export async function createTestDb() {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.resolve(import.meta.dirname, "../../drizzle") });
  return { db, client, schema };
}
