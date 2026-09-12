-- UserBehavior is consumed by the adaptive/user-intelligence learning service
-- and is part of the Prisma schema, but the historical migration chain never
-- created the table. Add the canonical table before its composite index.
CREATE TABLE IF NOT EXISTS "UserBehavior" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "context" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserBehavior_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'UserBehavior_userId_fkey'
  ) THEN
    ALTER TABLE "UserBehavior"
      ADD CONSTRAINT "UserBehavior_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "UserBehavior_userId_createdAt_idx"
ON "UserBehavior"("userId", "createdAt");
