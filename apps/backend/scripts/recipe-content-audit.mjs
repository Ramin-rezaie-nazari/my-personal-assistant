import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MIN_INGREDIENTS = Math.max(1, Number(process.env.RECIPE_MIN_INGREDIENTS ?? 3));
const MIN_STEPS = Math.max(1, Number(process.env.RECIPE_MIN_STEPS ?? 2));
const REQUIRE_VERIFIED = process.env.RECIPE_REQUIRE_VERIFIED !== '0';
const REQUIRE_IMAGE = process.env.RECIPE_REQUIRE_IMAGE !== '0';
const EXACT_MEDIA_COUNT = 1;
const MAX_SAMPLE = Math.max(1, Number(process.env.RECIPE_AUDIT_SAMPLE ?? 25));
const APPROVED_MEDIA_SOURCES = /Food Ingredients and Recipes Dataset with Images|Wikimedia Commons|Wikimedia Commons\/Wikibooks/i;

const failures = [];
const warn = [];

function fail(code, message, details = undefined) {
  failures.push({ code, message, ...(details ? { details } : {}) });
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function main() {
  const recipes = await prisma.recipe.findMany({
    where: { userId: null },
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      imageSource: true,
      verified: true,
      servings: true,
      calories: true,
      protein: true,
      carbs: true,
      fat: true,
      ingredients: {
        select: {
          id: true,
          quantity: true,
          unit: true,
          foodId: true,
          canonicalIngredientId: true,
          food: { select: { name: true } },
        },
      },
      steps: {
        orderBy: { stepNumber: 'asc' },
        select: { id: true, stepNumber: true, instruction: true, imageUrl: true },
      },
      media: {
        where: { status: 'approved' },
        orderBy: { position: 'asc' },
        select: {
          id: true,
          position: true,
          url: true,
          sourceUrl: true,
          sourceProvider: true,
          license: true,
          mimeType: true,
        },
      },
      cuisines: { select: { cuisineId: true } },
      regions: { select: { regionId: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const counts = {
    recipes: recipes.length,
    verified: recipes.filter((r) => r.verified).length,
    withDescription: recipes.filter((r) => cleanText(r.description)).length,
    withExactlyOneApprovedMedia: recipes.filter((r) => r.media.length === EXACT_MEDIA_COUNT).length,
    withIngredients: recipes.filter((r) => r.ingredients.length >= MIN_INGREDIENTS).length,
    withSteps: recipes.filter((r) => r.steps.length >= MIN_STEPS).length,
    withCuisine: recipes.filter((r) => r.cuisines.length > 0).length,
    withRegion: recipes.filter((r) => r.regions.length > 0).length,
  };

  for (const recipe of recipes) {
    if (!cleanText(recipe.name)) fail('missing_name', 'Recipe has no usable name.', { id: recipe.id });
    if (!Number.isInteger(recipe.servings) || recipe.servings <= 0) fail('invalid_servings', 'Recipe has invalid servings.', { id: recipe.id, servings: recipe.servings });
    if (REQUIRE_VERIFIED && !recipe.verified) fail('unverified', 'Release corpus contains an unverified recipe.', { id: recipe.id, name: recipe.name });
    if (recipe.ingredients.length < MIN_INGREDIENTS) fail('too_few_ingredients', `Recipe needs at least ${MIN_INGREDIENTS} ingredients.`, { id: recipe.id, name: recipe.name, count: recipe.ingredients.length });
    if (recipe.steps.length < MIN_STEPS) fail('too_few_steps', `Recipe needs at least ${MIN_STEPS} steps.`, { id: recipe.id, name: recipe.name, count: recipe.steps.length });
    if (REQUIRE_IMAGE && recipe.media.length !== EXACT_MEDIA_COUNT) {
      fail('invalid_media_count', `Recipe must have exactly ${EXACT_MEDIA_COUNT} approved final media asset.`, { id: recipe.id, name: recipe.name, count: recipe.media.length });
    }
    if (REQUIRE_IMAGE && recipe.media.length === EXACT_MEDIA_COUNT && cleanText(recipe.imageUrl) && recipe.imageUrl !== recipe.media[0].url) {
      fail('hero_url_drift', 'Recipe.imageUrl must match its canonical RecipeMedia URL when both are populated.', { id: recipe.id, name: recipe.name });
    }
    const stepNumbers = recipe.steps.map((s) => s.stepNumber);
    if (stepNumbers.some((n, i) => !Number.isInteger(n) || n !== i + 1)) {
      fail('non_contiguous_steps', 'Recipe steps must be numbered contiguously from 1.', { id: recipe.id, name: recipe.name, stepNumbers });
    }
    const duplicateMediaPositions = recipe.media.map((m) => m.position).filter((p, i, a) => a.indexOf(p) !== i);
    if (duplicateMediaPositions.length) fail('duplicate_media_position', 'Recipe contains duplicate media positions.', { id: recipe.id, duplicateMediaPositions });
    for (const ingredient of recipe.ingredients) {
      if (!Number.isFinite(ingredient.quantity) || ingredient.quantity <= 0) fail('invalid_ingredient_quantity', 'Ingredient quantity must be finite and > 0.', { id: recipe.id, ingredientId: ingredient.id });
      if (!cleanText(ingredient.unit)) fail('missing_ingredient_unit', 'Ingredient unit is empty.', { id: recipe.id, ingredientId: ingredient.id });
      if (!ingredient.foodId && !ingredient.canonicalIngredientId) fail('unresolved_ingredient', 'Ingredient has no linked food or canonical ingredient.', { id: recipe.id, ingredientId: ingredient.id });
      if (!cleanText(ingredient.food?.name)) fail('missing_food_name', 'Ingredient food has no usable name.', { id: recipe.id, ingredientId: ingredient.id });
    }
    for (const step of recipe.steps) {
      if (!cleanText(step.instruction)) fail('empty_step', 'Recipe step has no instruction.', { id: recipe.id, stepId: step.id });
    }
    for (const media of recipe.media) {
      if (!cleanText(media.url) || !cleanText(media.sourceUrl)) fail('invalid_media_url', 'Approved recipe media must have both delivery and source URLs.', { id: recipe.id, mediaId: media.id });
      if (!cleanText(media.license)) fail('missing_media_license', 'Approved recipe media must carry license metadata.', { id: recipe.id, mediaId: media.id });
      if (!cleanText(media.sourceProvider)) fail('missing_media_provider', 'Approved recipe media must carry source provider metadata.', { id: recipe.id, mediaId: media.id });
      if (!APPROVED_MEDIA_SOURCES.test(`${media.sourceProvider} ${media.license}`)) {
        fail('unapproved_media_source', 'Recipe release media must come from an approved real-image source.', { id: recipe.id, mediaId: media.id, sourceProvider: media.sourceProvider, license: media.license });
      }
      if (media.mimeType.toLowerCase() !== 'image/webp') {
        fail('non_webp_media', 'Recipe release media must be WebP.', { id: recipe.id, mediaId: media.id, mimeType: media.mimeType });
      }
      if (/generated|illustration/i.test(`${media.sourceProvider} ${media.license} ${media.url}`)) {
        fail('generated_media', 'Generated or illustration media is not accepted as recipe release media.', { id: recipe.id, mediaId: media.id });
      }
    }
  }

  const duplicateNames = await prisma.$queryRaw(Prisma.sql`
    SELECT lower(regexp_replace(trim("name"), '\\s+', ' ', 'g')) AS normalized, count(*)
    FROM "Recipe"
    WHERE "userId" IS NULL
    GROUP BY lower(regexp_replace(trim("name"), '\\s+', ' ', 'g'))
    HAVING count(*) > 1
    ORDER BY count(*) DESC
    LIMIT 100
  `);
  for (const row of duplicateNames) warn.push({ code: 'duplicate_recipe_name', normalized: row.normalized, count: Number(row.count) });

  const sample = recipes.slice(0, MAX_SAMPLE).map((r) => ({
    id: r.id,
    name: r.name,
    verified: r.verified,
    ingredients: r.ingredients.length,
    steps: r.steps.length,
    approvedMedia: r.media.length,
    cuisines: r.cuisines.length,
    regions: r.regions.length,
    hero: r.media.length === EXACT_MEDIA_COUNT ? r.media[0].url : null,
  }));

  const report = {
    status: failures.length ? 'failed' : 'pass',
    thresholds: { MIN_INGREDIENTS, MIN_STEPS, REQUIRE_VERIFIED, REQUIRE_IMAGE, EXACT_MEDIA_COUNT },
    counts,
    failures: failures.length,
    warnings: warn.length,
    failureSample: failures.slice(0, MAX_SAMPLE),
    warningSample: warn.slice(0, MAX_SAMPLE),
    sample,
  };
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exitCode = 2;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());