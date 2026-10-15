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
      SUPABASE_SEND_SMS_HOOK_SECRET: "test-event-submission-otp-secret",
      WENOVA_SMS_TOKEN: "test-token",
      WENOVA_SMS_HEADER: "WNV-OTP",
    },
  },
});
