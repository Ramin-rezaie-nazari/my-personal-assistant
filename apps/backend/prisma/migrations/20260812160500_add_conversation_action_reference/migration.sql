ALTER TABLE "ConversationTurn"
  ADD COLUMN "resourceType" TEXT,
  ADD COLUMN "resourceId" TEXT;

CREATE INDEX "ConversationTurn_userId_resourceType_resourceId_createdAt_idx"
  ON "ConversationTurn"("userId","resourceType","resourceId","createdAt");
