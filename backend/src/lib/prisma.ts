import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";
import { env } from "../config/env.ts";

const adapter = new PrismaPg({
  connectionString: env.databaseUrl || undefined,
  host: env.databaseUrl ? undefined : env.sql.host,
  port: env.sql.port,
  database: env.databaseUrl ? undefined : env.sql.database,
  user: env.databaseUrl ? undefined : env.sql.user,
  password: env.databaseUrl ? undefined : env.sql.password,
  max: env.databasePoolMax,
  connectionTimeoutMillis: 15000,
  ...(env.databaseForceSsl ? { ssl: { rejectUnauthorized: true } } : {}),
});

export const prisma = new PrismaClient({ adapter });
export type { Prisma } from "../generated/prisma/client.ts";
