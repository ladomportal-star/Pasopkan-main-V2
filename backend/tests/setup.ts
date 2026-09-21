import { vi } from "vitest";
import { startAuthServer } from "./helpers/auth.ts";
import { createTestDb } from "./helpers/testDb.ts";

// Runs before every test file, before the app is imported.
await startAuthServer();

// Swap the pg pool for an in-process Postgres that has the real migrations.
vi.mock("../src/config/database.ts", async () => {
  const { db, client, schema } = await createTestDb();
  return {
    db,
    schema,
    pool: { query: (sql: string, params?: unknown[]) => client.query(sql, params) },
  };
});
