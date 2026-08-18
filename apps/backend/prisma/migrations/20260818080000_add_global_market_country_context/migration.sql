ALTER TABLE "PriceSnapshot"
  ADD COLUMN IF NOT EXISTS "countryCode" TEXT;

ALTER TABLE "PriceCollectionRun"
  ADD COLUMN IF NOT EXISTS "countryCode" TEXT;

DROP INDEX IF EXISTS "PriceCollectionRun_scheduledFor_key";

CREATE INDEX IF NOT EXISTS "PriceSnapshot_countryCode_productKey_observedAt_idx"
  ON "PriceSnapshot" ("countryCode", "productKey", "observedAt");

CREATE INDEX IF NOT EXISTS "PriceSnapshot_countryCode_sourceId_observedAt_idx"
  ON "PriceSnapshot" ("countryCode", "sourceId", "observedAt");

CREATE UNIQUE INDEX IF NOT EXISTS "PriceCollectionRun_countryCode_scheduledFor_key"
  ON "PriceCollectionRun" ("countryCode", "scheduledFor");
