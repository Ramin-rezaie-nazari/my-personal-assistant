CREATE TABLE "PriceTrackedProduct" (
  "id" TEXT NOT NULL,
  "productKey" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "brand" TEXT,
  "quantity" DOUBLE PRECISION,
  "unit" TEXT,
  "city" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PriceTrackedProduct_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PriceTrackedProduct_productKey_key" ON "PriceTrackedProduct"("productKey");
CREATE INDEX "PriceTrackedProduct_active_idx" ON "PriceTrackedProduct"("active");

CREATE TABLE "PriceSource" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "baseUrl" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "adapterId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PriceSource_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PriceSource_adapterId_key" ON "PriceSource"("adapterId");

CREATE TABLE "PriceSnapshot" (
  "id" TEXT NOT NULL,
  "productKey" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'IRR',
  "amount" DOUBLE PRECISION NOT NULL,
  "unit" TEXT,
  "unitPrice" DOUBLE PRECISION,
  "city" TEXT,
  "availability" TEXT NOT NULL DEFAULT 'unknown',
  "observedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PriceSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PriceSnapshot_productKey_observedAt_idx" ON "PriceSnapshot"("productKey","observedAt");
CREATE INDEX "PriceSnapshot_sourceId_observedAt_idx" ON "PriceSnapshot"("sourceId","observedAt");
CREATE INDEX "PriceSnapshot_productKey_sourceId_observedAt_idx" ON "PriceSnapshot"("productKey","sourceId","observedAt");

CREATE TABLE "PriceCollectionRun" (
  "id" TEXT NOT NULL,
  "scheduledFor" TIMESTAMP(3) NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "status" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "collected" INTEGER NOT NULL DEFAULT 0,
  "failedSources" JSONB NOT NULL DEFAULT '[]',
  "attemptedSources" JSONB NOT NULL DEFAULT '[]',
  "error" TEXT,
  CONSTRAINT "PriceCollectionRun_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PriceCollectionRun_scheduledFor_key" ON "PriceCollectionRun"("scheduledFor");
CREATE INDEX "PriceCollectionRun_status_startedAt_idx" ON "PriceCollectionRun"("status","startedAt");

INSERT INTO "PriceSource" ("id","name","kind","baseUrl","enabled","adapterId") VALUES
('okala','اُکالا','retailer','https://okala.com',true,'okala'),
('snapp-market','اسنپ‌مارکت','retailer','https://snapp.market',true,'snapp-market'),
('digikala','دیجی‌کالا','marketplace','https://www.digikala.com',true,'digikala'),
('digishahrvand','دیجی‌شهروند','retailer','https://www.digishahrvand.com',true,'digishahrvand'),
('digikala-jet','دیجی‌کالا جت','retailer','https://digikalajet.com',true,'digikala-jet'),
('pinaket','پینکت','retailer','https://pinaket.com',true,'pinaket'),
('feenama','فی‌نما','marketplace','https://feenama.com',true,'feenama'),
('torob','ترب','marketplace','https://torob.com',true,'torob'),
('emalls','ایمالز','marketplace','https://emalls.ir',true,'emalls')
ON CONFLICT ("id") DO UPDATE SET "name"=EXCLUDED."name","kind"=EXCLUDED."kind","baseUrl"=EXCLUDED."baseUrl","enabled"=EXCLUDED."enabled","adapterId"=EXCLUDED."adapterId","updatedAt"=CURRENT_TIMESTAMP;
