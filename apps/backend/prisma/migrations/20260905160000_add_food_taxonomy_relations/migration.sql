-- CreateTable
CREATE TABLE "IngredientCanonical" (
    "id" TEXT NOT NULL,
    "canonicalKey" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "scientificName" TEXT,
    "foodGroup" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "provenance" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngredientCanonical_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientCanonicalAlias" (
    "id" TEXT NOT NULL,
    "canonicalIngredientId" TEXT NOT NULL,
    "normalizedAlias" TEXT NOT NULL,
    "displayAlias" TEXT NOT NULL,
    "provenance" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngredientCanonicalAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionCanonical" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "regionCode" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "provenance" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegionCanonical_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuisineCanonical" (
    "id" TEXT NOT NULL,
    "canonicalKey" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "parentCuisineId" TEXT,
    "provenance" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CuisineCanonical_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeSafetyAssertion" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "assertionType" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "effect" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "provenance" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "version" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeSafetyAssertion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeCuisine" (
    "recipeId" TEXT NOT NULL,
    "cuisineId" TEXT NOT NULL,

    CONSTRAINT "RecipeCuisine_pkey" PRIMARY KEY ("recipeId", "cuisineId")
);

-- CreateTable
CREATE TABLE "RecipeRegion" (
    "recipeId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,

    CONSTRAINT "RecipeRegion_pkey" PRIMARY KEY ("recipeId", "regionId")
);

-- AlterTable
ALTER TABLE "FoodItem" ADD COLUMN "canonicalIngredientId" TEXT;

-- AlterTable
ALTER TABLE "RecipeIngredient" ADD COLUMN "canonicalIngredientId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "IngredientCanonical_canonicalKey_key" ON "IngredientCanonical"("canonicalKey");

-- CreateIndex
CREATE UNIQUE INDEX "IngredientCanonicalAlias_canonicalIngredientId_normalizedAlias_key" ON "IngredientCanonicalAlias"("canonicalIngredientId", "normalizedAlias");
CREATE INDEX "IngredientCanonicalAlias_normalizedAlias_idx" ON "IngredientCanonicalAlias"("normalizedAlias");

-- CreateIndex
CREATE UNIQUE INDEX "RegionCanonical_countryCode_regionCode_key" ON "RegionCanonical"("countryCode", "regionCode");
CREATE INDEX "RegionCanonical_countryCode_idx" ON "RegionCanonical"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "CuisineCanonical_canonicalKey_key" ON "CuisineCanonical"("canonicalKey");
CREATE INDEX "CuisineCanonical_parentCuisineId_idx" ON "CuisineCanonical"("parentCuisineId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeSafetyAssertion_recipeId_assertionType_value_key" ON "RecipeSafetyAssertion"("recipeId", "assertionType", "value");
CREATE INDEX "RecipeSafetyAssertion_assertionType_value_verified_idx" ON "RecipeSafetyAssertion"("assertionType", "value", "verified");

-- CreateIndex
CREATE INDEX "RecipeCuisine_cuisineId_idx" ON "RecipeCuisine"("cuisineId");
CREATE INDEX "RecipeRegion_regionId_idx" ON "RecipeRegion"("regionId");
CREATE INDEX "FoodItem_canonicalIngredientId_idx" ON "FoodItem"("canonicalIngredientId");
CREATE INDEX "RecipeIngredient_canonicalIngredientId_idx" ON "RecipeIngredient"("canonicalIngredientId");

-- AddForeignKey
ALTER TABLE "IngredientCanonicalAlias" ADD CONSTRAINT "IngredientCanonicalAlias_canonicalIngredientId_fkey" FOREIGN KEY ("canonicalIngredientId") REFERENCES "IngredientCanonical"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodItem" ADD CONSTRAINT "FoodItem_canonicalIngredientId_fkey" FOREIGN KEY ("canonicalIngredientId") REFERENCES "IngredientCanonical"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_canonicalIngredientId_fkey" FOREIGN KEY ("canonicalIngredientId") REFERENCES "IngredientCanonical"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CuisineCanonical" ADD CONSTRAINT "CuisineCanonical_parentCuisineId_fkey" FOREIGN KEY ("parentCuisineId") REFERENCES "CuisineCanonical"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecipeSafetyAssertion" ADD CONSTRAINT "RecipeSafetyAssertion_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecipeCuisine" ADD CONSTRAINT "RecipeCuisine_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecipeCuisine" ADD CONSTRAINT "RecipeCuisine_cuisineId_fkey" FOREIGN KEY ("cuisineId") REFERENCES "CuisineCanonical"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecipeRegion" ADD CONSTRAINT "RecipeRegion_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecipeRegion" ADD CONSTRAINT "RecipeRegion_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "RegionCanonical"("id") ON DELETE CASCADE ON UPDATE CASCADE;
