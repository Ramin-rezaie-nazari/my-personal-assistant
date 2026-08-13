ALTER TABLE "DecisionOutcome"
  ADD COLUMN "source" TEXT NOT NULL DEFAULT 'user';

CREATE INDEX "DecisionOutcome_userId_source_createdAt_idx"
  ON "DecisionOutcome"("userId", "source", "createdAt");
