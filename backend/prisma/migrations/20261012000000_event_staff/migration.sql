-- Only an email supplied by a verified Supabase token is eligible for staff lookup.
-- Existing profile emails are deliberately not backfilled because they were editable.
ALTER TABLE "User" ADD COLUMN "authEmail" TEXT;
CREATE INDEX "User_authEmail_idx" ON "User"("authEmail");

CREATE TABLE "EventStaff" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "assignedByUserId" UUID NOT NULL,
    "assignedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMPTZ(3),
    CONSTRAINT "EventStaff_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventStaff_eventId_userId_key" ON "EventStaff"("eventId", "userId");
CREATE INDEX "EventStaff_userId_revokedAt_idx" ON "EventStaff"("userId", "revokedAt");
CREATE INDEX "EventStaff_eventId_revokedAt_idx" ON "EventStaff"("eventId", "revokedAt");

ALTER TABLE "EventStaff" ADD CONSTRAINT "EventStaff_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventStaff" ADD CONSTRAINT "EventStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventStaff" ADD CONSTRAINT "EventStaff_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Business permissions are enforced by the backend after JWT verification.
-- Supabase browser roles must not read or mutate assignment records directly.
ALTER TABLE "EventStaff" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "EventStaff" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "EventStaff" FROM authenticated;
  END IF;
END;
$$;
