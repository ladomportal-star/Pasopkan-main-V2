import { defineConfig } from "vitest/config";

// Pure provider contract tests: no database and no real PhaJay requests.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/phajay-provider.test.ts"],
    env: { NODE_ENV: "test", DATABASE_URL: "", SQL_HOST: "", LOG_LEVEL: "silent" },
  },
});
