CREATE TABLE "EventSubmissionOtp" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "phone" TEXT NOT NULL,
  "codeDigest" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "consumedAt" TIMESTAMPTZ(3),
  CONSTRAINT "EventSubmissionOtp_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EventSubmissionOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "EventSubmissionOtp_userId_createdAt_idx" ON "EventSubmissionOtp"("userId", "createdAt");
CREATE INDEX "EventSubmissionOtp_expiresAt_idx" ON "EventSubmissionOtp"("expiresAt");

ALTER TABLE "EventSubmissionOtp" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "EventSubmissionOtp" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "EventSubmissionOtp" FROM authenticated;
  END IF;
END;
$$;
