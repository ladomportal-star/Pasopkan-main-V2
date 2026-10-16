ALTER TABLE "User" ADD COLUMN "organizerTermsAcceptedAt" TIMESTAMPTZ(3);

-- Existing organizers who accepted terms while creating an event should not
-- have to accept them again after this migration.
UPDATE "User" AS u
SET "organizerTermsAcceptedAt" = accepted."acceptedAt"
FROM (
  SELECT "actorId", MIN("createdAt") AS "acceptedAt"
  FROM "AuditLog"
  WHERE action = 'event.terms_accepted' AND "actorId" IS NOT NULL
  GROUP BY "actorId"
) AS accepted
WHERE u.id = accepted."actorId";
