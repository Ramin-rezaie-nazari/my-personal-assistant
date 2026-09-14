-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameFa" TEXT,
    "aliases" JSONB NOT NULL DEFAULT '[]',
    "discipline" TEXT NOT NULL,
    "movementPattern" TEXT,
    "primaryMuscles" JSONB NOT NULL DEFAULT '[]',
    "secondaryMuscles" JSONB NOT NULL DEFAULT '[]',
    "equipment" JSONB NOT NULL DEFAULT '[]',
    "difficulty" TEXT NOT NULL,
    "goals" JSONB NOT NULL DEFAULT '[]',
    "instructions" TEXT,
    "coachCues" JSONB NOT NULL DEFAULT '[]',
    "commonMistakes" JSONB NOT NULL DEFAULT '[]',
    "cautions" JSONB NOT NULL DEFAULT '[]',
    "contentStatus" TEXT NOT NULL DEFAULT 'draft',
    "sourceProvider" TEXT,
    "sourceLicense" TEXT,
    "sourceAttribution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseMedia" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceProvider" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "attribution" TEXT,
    "mimeType" TEXT,
    "durationSeconds" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "language" TEXT,
    "posterUrl" TEXT,
    "checksum" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExerciseMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseRelationship" (
    "id" TEXT NOT NULL,
    "fromExerciseId" TEXT NOT NULL,
    "toExerciseId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExerciseRelationship_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "Exercise_slug_key" ON "Exercise"("slug");
CREATE INDEX "Exercise_discipline_difficulty_idx" ON "Exercise"("discipline", "difficulty");
CREATE INDEX "Exercise_contentStatus_idx" ON "Exercise"("contentStatus");
CREATE INDEX "ExerciseMedia_exerciseId_status_idx" ON "ExerciseMedia"("exerciseId", "status");
CREATE INDEX "ExerciseMedia_sourceProvider_license_idx" ON "ExerciseMedia"("sourceProvider", "license");
CREATE UNIQUE INDEX "ExerciseRelationship_from_to_kind_key" ON "ExerciseRelationship"("fromExerciseId", "toExerciseId", "kind");
CREATE INDEX "ExerciseRelationship_from_kind_priority_idx" ON "ExerciseRelationship"("fromExerciseId", "kind", "priority");
CREATE INDEX "ExerciseRelationship_to_kind_idx" ON "ExerciseRelationship"("toExerciseId", "kind");

-- Foreign keys
ALTER TABLE "ExerciseMedia" ADD CONSTRAINT "ExerciseMedia_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExerciseRelationship" ADD CONSTRAINT "ExerciseRelationship_fromExerciseId_fkey" FOREIGN KEY ("fromExerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExerciseRelationship" ADD CONSTRAINT "ExerciseRelationship_toExerciseId_fkey" FOREIGN KEY ("toExerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
