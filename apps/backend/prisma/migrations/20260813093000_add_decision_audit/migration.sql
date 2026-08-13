CREATE TABLE "DecisionAuditEntry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "decisionId" TEXT NOT NULL,
  "selectedIds" JSONB NOT NULL,
  "rejectedIds" JSONB NOT NULL,
  "blockedIds" JSONB NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DecisionAuditEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DecisionAuditEntry_userId_createdAt_idx" ON "DecisionAuditEntry"("userId", "createdAt");
CREATE INDEX "DecisionAuditEntry_userId_decisionId_idx" ON "DecisionAuditEntry"("userId", "decisionId");
