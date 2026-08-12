CREATE TABLE "Habit" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "frequency" TEXT NOT NULL DEFAULT 'daily',
  "targetPerWeek" INTEGER NOT NULL DEFAULT 7,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Habit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HabitLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "habitId" TEXT NOT NULL,
  "dateKey" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HabitLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Habit_userId_active_idx" ON "Habit"("userId", "active");
CREATE UNIQUE INDEX "HabitLog_habitId_dateKey_key" ON "HabitLog"("habitId", "dateKey");
CREATE INDEX "HabitLog_userId_dateKey_idx" ON "HabitLog"("userId", "dateKey");

ALTER TABLE "Habit" ADD CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HabitLog" ADD CONSTRAINT "HabitLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HabitLog" ADD CONSTRAINT "HabitLog_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
