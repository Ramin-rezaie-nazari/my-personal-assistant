CREATE TABLE "InventoryEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "foodId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "unit" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'manual',
  "idempotencyKey" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InventoryEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InventoryEvent_userId_idempotencyKey_key" ON "InventoryEvent"("userId", "idempotencyKey");
CREATE INDEX "InventoryEvent_userId_foodId_occurredAt_idx" ON "InventoryEvent"("userId", "foodId", "occurredAt");
CREATE INDEX "InventoryEvent_userId_occurredAt_idx" ON "InventoryEvent"("userId", "occurredAt");
CREATE INDEX "InventoryEvent_userId_type_occurredAt_idx" ON "InventoryEvent"("userId", "type", "occurredAt");

ALTER TABLE "InventoryEvent"
  ADD CONSTRAINT "InventoryEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InventoryEvent"
  ADD CONSTRAINT "InventoryEvent_foodId_fkey"
  FOREIGN KEY ("foodId") REFERENCES "FoodItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
