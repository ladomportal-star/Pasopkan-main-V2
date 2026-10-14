ALTER TABLE "Event"
  ADD COLUMN "eventPrivacy" TEXT NOT NULL DEFAULT 'public',
  ADD COLUMN "durationEn" TEXT,
  ADD COLUMN "durationLo" TEXT,
  ADD COLUMN "cancellationPolicy" TEXT,
  ADD COLUMN "attendeeMessage" TEXT;
ALTER TABLE "Event" ADD COLUMN "hasSeating" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "EventPrivateDetails" (
  "eventId" UUID NOT NULL,
  "bankName" TEXT,
  "accountNumber" TEXT,
  "accountHolder" TEXT,
  "onlinePlatform" TEXT,
  "onlineMeetingUrl" TEXT,
  "onlinePasscode" TEXT,
  "onlineInstructions" TEXT,
  "bookingSlotCapacities" JSONB,
  "attendeeQuestions" JSONB,
  "ticketSaleWindows" JSONB,
  "organizerSocialLinks" JSONB,
  CONSTRAINT "EventPrivateDetails_pkey" PRIMARY KEY ("eventId")
);

ALTER TABLE "EventPrivateDetails" ADD CONSTRAINT "EventPrivateDetails_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventPrivateDetails" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "EventPrivateDetails" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "EventPrivateDetails" FROM authenticated;
  END IF;
END;
$$;
