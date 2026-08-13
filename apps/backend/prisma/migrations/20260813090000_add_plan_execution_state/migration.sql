CREATE TABLE "PlanExecutionState" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "stepIds" JSONB NOT NULL,
  "completed" JSONB NOT NULL,
  "blocked" JSONB NOT NULL,
  "failed" JSONB NOT NULL,
  "currentStep" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlanExecutionState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlanExecutionState_userId_planId_key" ON "PlanExecutionState"("userId", "planId");
CREATE INDEX "PlanExecutionState_userId_status_updatedAt_idx" ON "PlanExecutionState"("userId", "status", "updatedAt");

ALTER TABLE "PlanExecutionState" ADD CONSTRAINT "PlanExecutionState_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
