ALTER TABLE "Notification" ADD COLUMN "dedupeKey" TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE "Notification" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 2;
CREATE UNIQUE INDEX "Notification_userId_dedupeKey_key" ON "Notification"("userId", "dedupeKey");
