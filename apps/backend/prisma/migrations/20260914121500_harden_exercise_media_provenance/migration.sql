-- Harden exercise media provenance without breaking existing approved assets.
ALTER TABLE "ExerciseMedia"
  ADD COLUMN "acquisitionMode" TEXT,
  ADD COLUMN "sourceReference" TEXT,
  ADD COLUMN "rightsBasis" TEXT,
  ADD COLUMN "creator" TEXT,
  ADD COLUMN "storageKey" TEXT,
  ADD COLUMN "transformed" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN "reviewer" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "contentVersion" TEXT;

CREATE INDEX "ExerciseMedia_acquisitionMode_status_idx"
  ON "ExerciseMedia"("acquisitionMode", "status");
CREATE INDEX "ExerciseMedia_rightsBasis_idx"
  ON "ExerciseMedia"("rightsBasis");
CREATE INDEX "ExerciseMedia_contentVersion_idx"
  ON "ExerciseMedia"("exerciseId", "contentVersion");
