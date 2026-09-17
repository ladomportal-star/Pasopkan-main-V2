import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * For migrations, prefer Supabase's "Direct connection" string
 * (db.<ref>.supabase.co:5432) in DATABASE_URL — poolers can reject DDL.
 */
const url = process.env.DATABASE_URL?.trim();

export default defineConfig({
  schema: "./src/models/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: url
    ? { url }
    : {
        host: process.env.SQL_HOST || "localhost",
        port: Number(process.env.SQL_PORT) || 5432,
        user: process.env.SQL_USER || "postgres",
        password: process.env.SQL_PASSWORD || "",
        database: process.env.SQL_DB_NAME || "pasopkan",
        ssl: process.env.DATABASE_SSL === "true",
      },
});
