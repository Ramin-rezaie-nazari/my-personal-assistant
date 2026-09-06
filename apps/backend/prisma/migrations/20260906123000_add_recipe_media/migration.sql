CREATE TABLE "RecipeMedia" (
  "id" TEXT NOT NULL,
  "recipeId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "url" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "sourceProvider" TEXT NOT NULL,
  "license" TEXT NOT NULL,
  "attribution" TEXT,
  "mimeType" TEXT NOT NULL DEFAULT 'image/webp',
  "width" INTEGER,
  "height" INTEGER,
  "checksum" TEXT,
  "status" TEXT NOT NULL DEFAULT 'approved',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecipeMedia_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RecipeMedia_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "RecipeMedia_recipeId_position_key" ON "RecipeMedia"("recipeId", "position");
CREATE INDEX "RecipeMedia_recipeId_status_idx" ON "RecipeMedia"("recipeId", "status");
CREATE INDEX "RecipeMedia_sourceProvider_license_idx" ON "RecipeMedia"("sourceProvider", "license");
