import { prisma } from "../lib/prisma.ts";
export const db = prisma;
export const pool = {
  query: (_sql?: string) => prisma.$queryRaw`SELECT 1`,
  end: () => prisma.$disconnect(),
};
