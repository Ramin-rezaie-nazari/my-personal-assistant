CREATE TABLE "Goal" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL DEFAULT 'general',
  "status" TEXT NOT NULL DEFAULT 'active',
  "priority" INTEGER NOT NULL DEFAULT 2,
  "targetDate" TIMESTAMP(3),
  "progressPercent" INTEGER NOT NULL DEFAULT 0,
  "targetValue" DOUBLE PRECISION,
  "currentValue" DOUBLE PRECISION,
  "unit" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GoalCheckin" (
  "id" TEXT NOT NULL,
  "goalId" TEXT NOT NULL,
  "dateKey" TEXT NOT NULL,
  "progressPercent" INTEGER NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GoalCheckin_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Goal_userId_status_priority_idx" ON "Goal"("userId", "status", "priority");
CREATE INDEX "Goal_userId_targetDate_idx" ON "Goal"("userId", "targetDate");
CREATE UNIQUE INDEX "GoalCheckin_goalId_dateKey_key" ON "GoalCheckin"("goalId", "dateKey");
CREATE INDEX "GoalCheckin_goalId_dateKey_idx" ON "GoalCheckin"("goalId", "dateKey");

ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GoalCheckin" ADD CONSTRAINT "GoalCheckin_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
