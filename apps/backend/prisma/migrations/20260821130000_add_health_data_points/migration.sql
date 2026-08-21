CREATE TABLE "HealthDataPoint" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "deviceId" TEXT,
  "dataType" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "unit" TEXT NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "sourceRecordId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HealthDataPoint_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "HealthDataPoint"
ADD CONSTRAINT "HealthDataPoint_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "HealthDataPoint_userId_provider_dataType_sourceRecordId_key"
ON "HealthDataPoint"("userId", "provider", "dataType", "sourceRecordId");

CREATE INDEX "HealthDataPoint_userId_dataType_startAt_idx"
ON "HealthDataPoint"("userId", "dataType", "startAt");

CREATE INDEX "HealthDataPoint_userId_provider_startAt_idx"
ON "HealthDataPoint"("userId", "provider", "startAt");
