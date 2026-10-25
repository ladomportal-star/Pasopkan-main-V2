CREATE TABLE "NotificationPreference" (
    "userId" UUID NOT NULL,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "systemUpdatesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "eventStatusEnabled" BOOLEAN NOT NULL DEFAULT true,
    "refundsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "payoutsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("userId"),
    CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "NotificationPreference" ENABLE ROW LEVEL SECURITY;
