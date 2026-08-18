-- Persist the source recipe serving count so scaling can be deterministic.
ALTER TABLE "Recipe"
ADD COLUMN "servings" INTEGER NOT NULL DEFAULT 2;

-- Guard against invalid persisted serving counts.
ALTER TABLE "Recipe"
ADD CONSTRAINT "Recipe_servings_positive"
CHECK ("servings" > 0);
