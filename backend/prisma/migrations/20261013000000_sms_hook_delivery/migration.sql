CREATE TABLE "SmsHookDelivery" (
  "id" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMPTZ(3),
  CONSTRAINT "SmsHookDelivery_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SmsHookDelivery_createdAt_idx" ON "SmsHookDelivery"("createdAt");

ALTER TABLE "SmsHookDelivery" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "SmsHookDelivery" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "SmsHookDelivery" FROM authenticated;
  END IF;
END;
$$;
