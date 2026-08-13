CREATE TABLE "FitnessProfileState" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "profile" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FitnessProfileState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FitnessProfileState_userId_key" ON "FitnessProfileState"("userId");
CREATE INDEX "FitnessProfileState_updatedAt_idx" ON "FitnessProfileState"("updatedAt");

ALTER TABLE "FitnessProfileState" ADD CONSTRAINT "FitnessProfileState_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
