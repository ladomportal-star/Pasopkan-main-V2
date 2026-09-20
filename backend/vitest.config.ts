import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Force the API into offline mode: no real DB, and ID-token verification
    // explicitly bypassed so tests can use a plain uid as the bearer token.
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "",
      SQL_HOST: "",
      FIREBASE_PROJECT_ID: "",
      AUTH_DEV_BYPASS: "true",
    },
  },
});
