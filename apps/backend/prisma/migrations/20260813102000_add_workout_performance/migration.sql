CREATE TABLE "WorkoutPerformance" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "workoutId" TEXT,
  "discipline" TEXT NOT NULL,
  "exerciseId" TEXT,
  "exerciseName" TEXT,
  "sessionId" TEXT,
  "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "formScore" DOUBLE PRECISION,
  "completionRate" DOUBLE PRECISION,
  "perceivedDifficulty" DOUBLE PRECISION,
  "recoveryScore" DOUBLE PRECISION,
  "reps" INTEGER,
  "sets" INTEGER,
  "durationSeconds" INTEGER,
  "loadKg" DOUBLE PRECISION,
  "metadata" JSONB,
  CONSTRAINT "WorkoutPerformance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkoutPerformance_userId_performedAt_idx" ON "WorkoutPerformance"("userId", "performedAt");
CREATE INDEX "WorkoutPerformance_userId_discipline_performedAt_idx" ON "WorkoutPerformance"("userId", "discipline", "performedAt");
CREATE INDEX "WorkoutPerformance_userId_exerciseId_performedAt_idx" ON "WorkoutPerformance"("userId", "exerciseId", "performedAt");

ALTER TABLE "WorkoutPerformance" ADD CONSTRAINT "WorkoutPerformance_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkoutPerformance" ADD CONSTRAINT "WorkoutPerformance_workoutId_fkey"
  FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
