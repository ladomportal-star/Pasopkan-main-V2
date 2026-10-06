import { vi, afterAll } from "vitest";
import { startAuthServer } from "./helpers/auth.ts";
import { createTestDb } from "./helpers/testDb.ts";
const auth = await startAuthServer();
vi.mock("../src/config/database.ts", async () => {
  const { db } = await createTestDb();
  return { db, pool: { query: () => db.$queryRaw`SELECT 1`, end: () => db.$disconnect() } };
});
afterAll(async () => {
  const { db } = await import("../src/config/database.ts");
  await db.$disconnect();
  auth.close();
});
