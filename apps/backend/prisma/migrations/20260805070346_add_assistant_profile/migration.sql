-- CreateTable
CREATE TABLE "AssistantProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "healthGoal" TEXT,
    "fitnessGoal" TEXT,
    "nutritionGoal" TEXT,
    "smokingHabit" TEXT,
    "waterGoalMl" INTEGER,
    "sleepGoalHours" DOUBLE PRECISION,
    "exerciseGoal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssistantProfile_userId_key" ON "AssistantProfile"("userId");

-- AddForeignKey
ALTER TABLE "AssistantProfile" ADD CONSTRAINT "AssistantProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
