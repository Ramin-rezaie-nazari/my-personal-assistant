CREATE TABLE "ShoppingItem" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "foodId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "unit" TEXT NOT NULL DEFAULT 'g',
  "source" TEXT NOT NULL DEFAULT 'manual',
  "sourceRecipeId" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShoppingItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ShoppingItem_userId_completed_priority_idx" ON "ShoppingItem"("userId","completed","priority");
CREATE INDEX "ShoppingItem_userId_createdAt_idx" ON "ShoppingItem"("userId","createdAt");
CREATE UNIQUE INDEX "ShoppingItem_userId_foodId_completed_key" ON "ShoppingItem"("userId","foodId","completed");
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "FoodItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
