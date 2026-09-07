import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

if (!process.env.MYPA_RECIPE_DATABASE_URL && !process.env.DATABASE_URL) {
  throw new Error('MYPA_RECIPE_DATABASE_URL or DATABASE_URL is required for recipe media runtime audit.');
}

async function main() {
  const [recipes, approvedMedia, distinctMediaRecipes, duplicateGroups, invalidMime, missingImageUrl] = await Promise.all([
    prisma.recipe.count(),
    prisma.recipeMedia.count({ where: { status: 'approved', position: 1, mimeType: 'image/webp' } }),
    prisma.recipeMedia.groupBy({ by: ['recipeId'], where: { status: 'approved' } }),
    prisma.recipeMedia.groupBy({ by: ['recipeId'], where: { status: 'approved' }, _count: { recipeId: true }, having: { recipeId: { _count: { gt: 1 } } } }),
    prisma.recipeMedia.count({ where: { status: 'approved', mimeType: { not: 'image/webp' } } }),
    prisma.recipe.count({ where: { imageUrl: null } }),
  ]);

  const runtimeLinks = await prisma.$queryRaw<Array<{ mismatches: bigint }>>`
    SELECT COUNT(*)::bigint AS mismatches
    FROM "Recipe" r
    LEFT JOIN "RecipeMedia" m
      ON m."recipeId" = r."id"
     AND m."position" = 1
     AND m."status" = 'approved'
    WHERE r."imageUrl" IS DISTINCT FROM m."url"
  `;
  const mismatches = Number(runtimeLinks[0]?.mismatches ?? 0n);
  const distinctCount = distinctMediaRecipes.length;
  const result = {
    status: recipes > 0 && approvedMedia === recipes && distinctCount === recipes && duplicateGroups.length === 0 && invalidMime === 0 && missingImageUrl === 0 && mismatches === 0 ? 'complete' : 'incomplete',
    recipes,
    approvedWebpPositionOneMedia: approvedMedia,
    distinctRecipesWithApprovedMedia: distinctCount,
    duplicateApprovedMediaRecipes: duplicateGroups.length,
    invalidMimeApprovedMedia: invalidMime,
    recipesMissingImageUrl: missingImageUrl,
    recipeImageUrlMediaMismatches: mismatches,
  };
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'complete') process.exitCode = 2;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
