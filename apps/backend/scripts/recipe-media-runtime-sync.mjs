import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PAGE_SIZE = 500;
const HERO_BUCKET = 'recipe-images';

if (!process.env.MYPA_RECIPE_DATABASE_URL && !process.env.DATABASE_URL) {
  throw new Error('MYPA_RECIPE_DATABASE_URL or DATABASE_URL is required for runtime recipe media sync.');
}
if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for runtime recipe media sync.');
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

async function fetchHeroes(offset) {
  const params = new URLSearchParams({
    select: 'recipe_id,image_url,source_url,source_name,source_license,source_attribution,mime_type,width,height',
    image_type: 'eq.hero',
    order: 'recipe_id.asc',
    limit: String(PAGE_SIZE),
    offset: String(offset),
  });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/recipe_images?${params.toString()}`, { headers });
  const body = await response.text();
  if (!response.ok) throw new Error(`Supabase recipe_images ${response.status}: ${body}`);
  return body ? JSON.parse(body) : [];
}

function publicStorageUrl(recipeId) {
  const key = `recipes/${recipeId}/hero.webp`;
  return `${SUPABASE_URL}/storage/v1/object/public/${HERO_BUCKET}/${key}`;
}

async function syncHero(hero) {
  const recipeId = hero.recipe_id;
  const url = hero.image_url || publicStorageUrl(recipeId);
  if (!recipeId || !url) return false;
  if ((hero.mime_type || 'image/webp').toLowerCase() !== 'image/webp') {
    throw new Error(`Runtime sync rejected non-WebP hero for ${recipeId}: ${hero.mime_type}`);
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.recipe.count({ where: { id: recipeId } });
    if (existing !== 1) return;
    await tx.recipe.updateMany({
      where: { id: recipeId },
      data: {
        imageUrl: url,
        imageSource: `${hero.source_name || 'recipe-images'}; ${hero.source_license || 'unknown'}`,
      },
    });

    await tx.recipeMedia.deleteMany({ where: { recipeId } });
    await tx.recipeMedia.create({
      data: {
        recipeId,
        position: 1,
        url,
        sourceUrl: hero.source_url || url,
        sourceProvider: hero.source_name || 'recipe-images',
        license: hero.source_license || 'unknown',
        attribution: hero.source_attribution || null,
        mimeType: 'image/webp',
        width: hero.width || null,
        height: hero.height || null,
        status: 'approved',
      },
    });
  });
  return true;
}

async function main() {
  let offset = 0;
  let fetched = 0;
  let synced = 0;
  let missingRuntimeRecipe = 0;

  while (true) {
    const heroes = await fetchHeroes(offset);
    if (!heroes.length) break;
    fetched += heroes.length;

    for (const hero of heroes) {
      try {
        const existing = await prisma.recipe.count({ where: { id: hero.recipe_id } });
        if (existing !== 1) {
          missingRuntimeRecipe += 1;
          continue;
        }
        if (await syncHero(hero)) synced += 1;
      } catch (error) {
        await prisma.$disconnect();
        throw new Error(`Runtime media sync failed for ${hero.recipe_id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    console.log(JSON.stringify({ offset, batch: heroes.length, fetched, synced, missingRuntimeRecipe }));
    if (heroes.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  const runtimeRecipes = await prisma.recipe.count();
  const runtimeHeroes = await prisma.recipeMedia.count({ where: { position: 1, status: 'approved', mimeType: 'image/webp' } });
  console.log(JSON.stringify({ status: 'complete', sourceHeroesFetched: fetched, runtimeHeroesSynced: synced, missingRuntimeRecipe, runtimeRecipes, runtimeApprovedWebpHeroes: runtimeHeroes }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });