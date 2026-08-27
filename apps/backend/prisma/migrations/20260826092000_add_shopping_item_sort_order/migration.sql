ALTER TABLE "ShoppingItem"
  ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "ShoppingItem_userId_completed_sortOrder_idx"
  ON "ShoppingItem"("userId", "completed", "sortOrder");
