CREATE TABLE "Supplement" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "dosage" TEXT,
  "frequency" TEXT NOT NULL DEFAULT 'daily',
  "scheduledTime" TEXT NOT NULL DEFAULT '09:00',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Supplement_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SupplementLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "supplementId" TEXT NOT NULL,
  "dateKey" TEXT NOT NULL,
  "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupplementLog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SupplementLog_supplementId_dateKey_key" ON "SupplementLog"("supplementId", "dateKey");
CREATE INDEX "Supplement_userId_active_idx" ON "Supplement"("userId", "active");
CREATE INDEX "SupplementLog_userId_dateKey_idx" ON "SupplementLog"("userId", "dateKey");
ALTER TABLE "Supplement" ADD CONSTRAINT "Supplement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupplementLog" ADD CONSTRAINT "SupplementLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupplementLog" ADD CONSTRAINT "SupplementLog_supplementId_fkey" FOREIGN KEY ("supplementId") REFERENCES "Supplement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
