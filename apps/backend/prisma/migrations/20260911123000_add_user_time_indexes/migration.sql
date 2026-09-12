-- Add the composite index for the user-scoped chronological workout queries.
-- UserBehavior is created by a later compatibility migration because the
-- historical migration chain does not create that table.
CREATE INDEX IF NOT EXISTS "Workout_userId_performedAt_idx"
ON "Workout"("userId", "performedAt");
