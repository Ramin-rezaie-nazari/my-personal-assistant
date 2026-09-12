import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [recipes, media, steps, orphanMediaRows, orphanStepRows] = await Promise.all([
    prisma.recipe.count({ where: { userId: null, verified: true } }),
    prisma.recipeMedia.count({ where: { status: 'approved', mimeType: 'image/webp' } }),
    prisma.recipeStep.count(),
    prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "RecipeMedia" media
      LEFT JOIN "Recipe" recipe ON recipe."id" = media."recipeId"
      WHERE recipe."id" IS NULL
    `,
    prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "RecipeStep" step
      LEFT JOIN "Recipe" recipe ON recipe."id" = step."recipeId"
      WHERE recipe."id" IS NULL
    `,
  ]);

  const orphanMedia = Number(orphanMediaRows[0]?.count ?? 0);
  const orphanSteps = Number(orphanStepRows[0]?.count ?? 0);

  const mediaByRecipe = await prisma.recipe.findMany({
    where: { userId: null, verified: true },
    select: {
      id: true,
      name: true,
      ingredients: { select: { id: true } },
      steps: { select: { id: true, instruction: true }, orderBy: { stepNumber: 'asc' } },
      media: { where: { status: 'approved', mimeType: 'image/webp' }, select: { id: true, url: true, sourceProvider: true, license: true } },
    },
  });

  const failures = [];
  for (const recipe of mediaByRecipe) {
    if (recipe.ingredients.length < 1) failures.push(`${recipe.id}: no ingredients`);
    if (recipe.steps.length < 1) failures.push(`${recipe.id}: no cooking steps`);
    if (recipe.steps.some((step) => step.instruction.trim().length < 20)) failures.push(`${recipe.id}: weak cooking step`);
    if (recipe.media.length < 1) failures.push(`${recipe.id}: no approved WebP media`);
    if (recipe.media.some((item) => !item.url || !item.sourceProvider || !item.license)) failures.push(`${recipe.id}: incomplete media provenance`);
  }

  console.log(`VERIFIED_RECIPES=${recipes}`);
  console.log(`APPROVED_WEBP_MEDIA=${media}`);
  console.log(`RECIPE_STEPS=${steps}`);
  console.log(`ORPHAN_MEDIA=${orphanMedia}`);
  console.log(`ORPHAN_STEPS=${orphanSteps}`);
  console.log(`CHECKED_RECIPES=${mediaByRecipe.length}`);
  console.log(`FAILURES=${failures.length}`);

  if (orphanMedia > 0 || orphanSteps > 0) {
    failures.push(`orphan media=${orphanMedia}, orphan steps=${orphanSteps}`);
  }
  if (failures.length) {
    console.error(failures.slice(0, 50).map((item) => `[FAIL] ${item}`).join('\n'));
    process.exitCode = 2;
  } else {
    console.log('RECIPE CONTENT GATE PASSED.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
