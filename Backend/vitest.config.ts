import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Force the API into offline mode: no real DB, no Firebase.
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "",
      SQL_HOST: "",
      FIREBASE_PROJECT_ID: "",
    },
  },
});
