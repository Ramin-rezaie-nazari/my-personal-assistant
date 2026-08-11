-- Store the client-selected calendar day on each nutrition log.
ALTER TABLE "NutritionLog"
ADD COLUMN "dateKey" TEXT NOT NULL DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD');

CREATE INDEX "NutritionLog_userId_dateKey_idx"
ON "NutritionLog"("userId", "dateKey");
