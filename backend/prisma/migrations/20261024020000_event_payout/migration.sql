-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'paid');

-- CreateTable
CREATE TABLE "EventPayout" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "feePercent" INTEGER NOT NULL DEFAULT 10,
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "grossKip" INTEGER,
    "feeKip" INTEGER,
    "payoutKip" INTEGER,
    "billImageRef" TEXT,
    "paidAt" TIMESTAMPTZ(3),
    "paidByUserId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "EventPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventPayout_eventId_key" ON "EventPayout"("eventId");

-- CreateIndex
CREATE INDEX "EventPayout_status_idx" ON "EventPayout"("status");

-- AddForeignKey
ALTER TABLE "EventPayout" ADD CONSTRAINT "EventPayout_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPayout" ADD CONSTRAINT "EventPayout_paidByUserId_fkey" FOREIGN KEY ("paidByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Match the project's convention: backend-only access, no direct Supabase API reads.
ALTER TABLE "EventPayout" ENABLE ROW LEVEL SECURITY;
