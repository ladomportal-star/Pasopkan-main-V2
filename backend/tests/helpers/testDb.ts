import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
export async function createTestDb() {
  const url = process.env.PRISMA_TEST_DATABASE_URL;
  if (!url || new URL(url).hostname !== "127.0.0.1") throw new Error("Run npm test: requires isolated local cluster");
  const schema = "test_" + randomUUID().replaceAll("-", "");
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  await client.query('CREATE SCHEMA "' + schema + '"');
  await client.query('SET search_path TO "' + schema + '"');
  const folder = path.resolve(import.meta.dirname, "../../prisma/migrations");
  for (const name of readdirSync(folder).sort()) if (!name.endsWith(".toml")) await client.query(readFileSync(path.join(folder,name,"migration.sql"),"utf8"));
  await client.end();
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url, options: '-c search_path=' + schema }, { schema }) });
  return { db };
}
