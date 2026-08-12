ALTER TABLE "Notification" ADD COLUMN "dedupeKey" TEXT;
ALTER TABLE "Notification" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 2;
UPDATE "Notification" SET "dedupeKey" = 'legacy-' || "id" WHERE "dedupeKey" IS NULL;
ALTER TABLE "Notification" ALTER COLUMN "dedupeKey" SET NOT NULL;
CREATE UNIQUE INDEX "Notification_userId_dedupeKey_key" ON "Notification"("userId", "dedupeKey");
