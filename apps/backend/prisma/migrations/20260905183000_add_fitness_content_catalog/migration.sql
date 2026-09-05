-- Persistent fitness content catalog.
-- The tables intentionally use scalar PostgreSQL arrays so the API can query
-- the corpus without coupling Prisma Client generation to this content feed.

CREATE TABLE "FitnessExerciseCatalog" (
  "id" TEXT NOT NULL,
  "discipline" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "nameFa" TEXT,
  "description" TEXT,
  "difficultyLevel" INTEGER NOT NULL,
  "sourceLevel" TEXT,
  "parentExerciseId" TEXT,
  "variantKind" TEXT,
  "focus" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "equipment" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "instructions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "cues" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "sourceProvider" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "license" TEXT NOT NULL,
  "attribution" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FitnessExerciseCatalog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FitnessExerciseCatalog_discipline_slug_key"
  ON "FitnessExerciseCatalog"("discipline", "slug");
CREATE INDEX "FitnessExerciseCatalog_discipline_level_status_idx"
  ON "FitnessExerciseCatalog"("discipline", "difficultyLevel", "status");
CREATE INDEX "FitnessExerciseCatalog_parentExerciseId_idx"
  ON "FitnessExerciseCatalog"("parentExerciseId");

ALTER TABLE "FitnessExerciseCatalog"
  ADD CONSTRAINT "FitnessExerciseCatalog_parentExerciseId_fkey"
  FOREIGN KEY ("parentExerciseId") REFERENCES "FitnessExerciseCatalog"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "FitnessExerciseMedia" (
  "id" TEXT NOT NULL,
  "exerciseId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "webpUrl" TEXT NOT NULL,
  "format" TEXT NOT NULL DEFAULT 'webp',
  "sourceProvider" TEXT NOT NULL,
  "license" TEXT NOT NULL,
  "attribution" TEXT,
  "checksum" TEXT,
  "width" INTEGER,
  "height" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FitnessExerciseMedia_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FitnessExerciseMedia_exerciseId_fkey"
    FOREIGN KEY ("exerciseId") REFERENCES "FitnessExerciseCatalog"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "FitnessExerciseMedia_exerciseId_position_key"
  ON "FitnessExerciseMedia"("exerciseId", "position");
CREATE INDEX "FitnessExerciseMedia_exerciseId_status_idx"
  ON "FitnessExerciseMedia"("exerciseId", "status");
CREATE INDEX "FitnessExerciseMedia_license_idx"
  ON "FitnessExerciseMedia"("license");

CREATE TABLE "FitnessDisciplineProgress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "discipline" TEXT NOT NULL,
  "currentLevel" INTEGER NOT NULL DEFAULT 1,
  "sessionsCompleted" INTEGER NOT NULL DEFAULT 0,
  "completionRate" DOUBLE PRECISION,
  "formScoreAvg" DOUBLE PRECISION,
  "recentDifficulty" INTEGER,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FitnessDisciplineProgress_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FitnessDisciplineProgress_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "FitnessDisciplineProgress_userId_discipline_key"
  ON "FitnessDisciplineProgress"("userId", "discipline");
CREATE INDEX "FitnessDisciplineProgress_userId_updatedAt_idx"
  ON "FitnessDisciplineProgress"("userId", "updatedAt");
