CREATE TABLE "ConversationTurn" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "intent" TEXT,
  "action" TEXT,
  "executionId" TEXT,
  "resourceType" TEXT,
  "resourceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConversationTurn_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ConversationTurn_userId_createdAt_idx" ON "ConversationTurn"("userId", "createdAt");
CREATE INDEX "ConversationTurn_userId_action_idx" ON "ConversationTurn"("userId", "action");
CREATE INDEX "ConversationTurn_userId_resourceType_resourceId_createdAt_idx"
  ON "ConversationTurn"("userId", "resourceType", "resourceId", "createdAt");

ALTER TABLE "ConversationTurn" ADD CONSTRAINT "ConversationTurn_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
