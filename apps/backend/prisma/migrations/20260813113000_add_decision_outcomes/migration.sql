CREATE TABLE "DecisionOutcome" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "decisionId" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "score" DOUBLE PRECISION,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DecisionOutcome_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DecisionOutcome_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "DecisionOutcome_userId_createdAt_idx" ON "DecisionOutcome"("userId", "createdAt");
CREATE INDEX "DecisionOutcome_userId_decisionId_idx" ON "DecisionOutcome"("userId", "decisionId");
CREATE INDEX "DecisionOutcome_userId_outcome_idx" ON "DecisionOutcome"("userId", "outcome");
