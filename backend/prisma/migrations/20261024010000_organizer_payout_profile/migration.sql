ALTER TABLE "Organizer"
  ADD COLUMN "bankName" TEXT,
  ADD COLUMN "accountNumber" TEXT,
  ADD COLUMN "accountHolder" TEXT;

WITH latest_bank AS (
  SELECT DISTINCT ON (e."organizerId")
    e."organizerId",
    p."bankName",
    p."accountNumber",
    p."accountHolder"
  FROM "Event" e
  INNER JOIN "EventPrivateDetails" p ON p."eventId" = e.id
  WHERE p."bankName" IS NOT NULL
     OR p."accountNumber" IS NOT NULL
     OR p."accountHolder" IS NOT NULL
  ORDER BY e."organizerId", e."updatedAt" DESC
)
UPDATE "Organizer" o
SET "bankName" = b."bankName",
    "accountNumber" = b."accountNumber",
    "accountHolder" = b."accountHolder"
FROM latest_bank b
WHERE o.id = b."organizerId";
