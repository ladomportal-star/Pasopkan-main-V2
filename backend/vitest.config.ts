import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/prisma/**"],
    setupFiles: ["tests/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Tests bring isolated PostgreSQL schemas and an identity provider (tests/helpers).
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "",
      SQL_HOST: "",
      LOG_LEVEL: "silent",
    },
  },
});
