-- Add composite indexes for the user-scoped chronological queries used by
-- workout history and adaptive/user-behavior learning reads.
CREATE INDEX "Workout_userId_performedAt_idx"
ON "Workout"("userId", "performedAt");

CREATE INDEX "UserBehavior_userId_createdAt_idx"
ON "UserBehavior"("userId", "createdAt");
