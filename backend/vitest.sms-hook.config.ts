import { defineConfig } from "vitest/config";

// Pure webhook unit tests: no PostgreSQL cluster or real Wenova request.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/sms-hook.test.ts"],
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "",
      SQL_HOST: "",
      LOG_LEVEL: "silent",
    },
  },
});
