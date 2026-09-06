-- Persisted step-by-step cooking instructions for verified and internal recipes.
CREATE TABLE "RecipeStep" (
  "id" TEXT NOT NULL,
  "recipeId" TEXT NOT NULL,
  "stepNumber" INTEGER NOT NULL,
  "instruction" TEXT NOT NULL,
  "durationSeconds" INTEGER,
  "temperatureC" DOUBLE PRECISION,
  "imageUrl" TEXT,
  "imageSource" TEXT,
  "sourceLicense" TEXT,
  "sourceAttribution" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecipeStep_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RecipeStep_recipeId_fkey"
    FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "RecipeStep_recipeId_stepNumber_key"
  ON "RecipeStep"("recipeId", "stepNumber");
CREATE INDEX "RecipeStep_recipeId_stepNumber_idx"
  ON "RecipeStep"("recipeId", "stepNumber");
CREATE INDEX "RecipeStep_imageSource_idx"
  ON "RecipeStep"("imageSource");
