ALTER TABLE "PriceSource"
  ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'global',
  ADD COLUMN "countryCodes" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "refreshCadence" TEXT NOT NULL DEFAULT 'daily';

UPDATE "PriceSource"
SET
  "scope" = 'country',
  "countryCodes" = '["IR"]'::jsonb,
  "refreshCadence" = 'daily'
WHERE "adapterId" IN (
  'okala',
  'snapp-market',
  'digikala',
  'digishahrvand',
  'digikala-jet',
  'pinaket',
  'feenama',
  'torob',
  'emalls'
);

ALTER TABLE "PriceSnapshot"
  ADD COLUMN "sourceRecordId" TEXT,
  ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT 'IR';

CREATE INDEX "PriceSnapshot_countryCode_productKey_observedAt_idx"
  ON "PriceSnapshot"("countryCode","productKey","observedAt");

CREATE INDEX "PriceSnapshot_countryCode_observedAt_idx"
  ON "PriceSnapshot"("countryCode","observedAt");

CREATE UNIQUE INDEX "PriceSnapshot_sourceId_sourceRecordId_key"
  ON "PriceSnapshot"("sourceId","sourceRecordId");

INSERT INTO "PriceSource"
  ("id","name","kind","baseUrl","enabled","adapterId","scope","countryCodes","refreshCadence")
VALUES
  (
    'open-prices',
    'Open Prices (Open Food Facts)',
    'public_dataset',
    'https://prices.openfoodfacts.org',
    true,
    'open-prices',
    'global',
    '[]'::jsonb,
    'realtime'
  ),
  (
    'fao-fpma',
    'FAO FPMA',
    'public_dataset',
    'https://fpma.fao.org',
    true,
    'fao-fpma',
    'global',
    '[]'::jsonb,
    'monthly'
  )
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "kind" = EXCLUDED."kind",
  "baseUrl" = EXCLUDED."baseUrl",
  "enabled" = EXCLUDED."enabled",
  "adapterId" = EXCLUDED."adapterId",
  "scope" = EXCLUDED."scope",
  "countryCodes" = EXCLUDED."countryCodes",
  "refreshCadence" = EXCLUDED."refreshCadence",
  "updatedAt" = CURRENT_TIMESTAMP;
