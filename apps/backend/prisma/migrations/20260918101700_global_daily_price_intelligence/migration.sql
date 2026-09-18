ALTER TABLE "PriceSource"
  ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'local',
  ADD COLUMN "collectionMode" TEXT NOT NULL DEFAULT 'tracked_products',
  ADD COLUMN "license" TEXT;

ALTER TABLE "PriceSnapshot"
  ADD COLUMN "countryCode" TEXT;

CREATE INDEX "PriceSnapshot_countryCode_productKey_observedAt_idx"
  ON "PriceSnapshot"("countryCode","productKey","observedAt");

ALTER TABLE "PriceCollectionRun"
  ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'local',
  ADD COLUMN "sourceId" TEXT;

CREATE INDEX "PriceCollectionRun_scope_startedAt_idx"
  ON "PriceCollectionRun"("scope","startedAt");

CREATE TABLE "PriceCoverageSnapshot" (
  "id" TEXT NOT NULL,
  "countryCode" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "lastObservedAt" TIMESTAMP(3),
  "lastCollectedAt" TIMESTAMP(3) NOT NULL,
  "observationCount" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PriceCoverageSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PriceCoverageSnapshot_sourceId_countryCode_key"
  ON "PriceCoverageSnapshot"("sourceId","countryCode");
CREATE INDEX "PriceCoverageSnapshot_countryCode_status_idx"
  ON "PriceCoverageSnapshot"("countryCode","status");
CREATE INDEX "PriceCoverageSnapshot_sourceId_updatedAt_idx"
  ON "PriceCoverageSnapshot"("sourceId","updatedAt");

INSERT INTO "PriceSource"
  ("id","name","kind","baseUrl","enabled","adapterId","scope","collectionMode","license")
VALUES
  ('open-prices','Open Prices (Open Food Facts)','open_dataset','https://prices.openfoodfacts.org',true,'open-prices','global','global_recent','ODbL-1.0')
ON CONFLICT ("id") DO UPDATE SET
  "name"=EXCLUDED."name",
  "kind"=EXCLUDED."kind",
  "baseUrl"=EXCLUDED."baseUrl",
  "enabled"=EXCLUDED."enabled",
  "adapterId"=EXCLUDED."adapterId",
  "scope"=EXCLUDED."scope",
  "collectionMode"=EXCLUDED."collectionMode",
  "license"=EXCLUDED."license",
  "updatedAt"=CURRENT_TIMESTAMP;