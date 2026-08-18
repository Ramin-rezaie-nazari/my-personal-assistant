ALTER TABLE "RecipeIngredient"
  ADD COLUMN "measurementKind" TEXT NOT NULL DEFAULT 'unitless',
  ADD COLUMN "scalingPolicy" TEXT NOT NULL DEFAULT 'linear',
  ADD COLUMN "scalingExponent" DOUBLE PRECISION,
  ADD COLUMN "batchSize" DOUBLE PRECISION,
  ADD COLUMN "maxLinearMultiplier" DOUBLE PRECISION;
