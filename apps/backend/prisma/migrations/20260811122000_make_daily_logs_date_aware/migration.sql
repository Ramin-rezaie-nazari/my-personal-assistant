-- Convert the one-row-per-user daily log into one row per user per calendar day.
ALTER TABLE "DailyLog"
ADD COLUMN "dateKey" TEXT NOT NULL DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD');

DROP INDEX "DailyLog_userId_key";

CREATE UNIQUE INDEX "DailyLog_userId_dateKey_key"
ON "DailyLog"("userId", "dateKey");
