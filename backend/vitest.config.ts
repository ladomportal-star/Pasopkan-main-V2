import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Tests bring their own database (PGlite) and identity provider (tests/helpers).
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "",
      SQL_HOST: "",
      LOG_LEVEL: "silent",
    },
  },
});
