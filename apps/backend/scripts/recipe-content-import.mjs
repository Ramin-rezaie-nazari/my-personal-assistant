import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DATASET_URL = process.env.RECIPE_DATASET_URL ?? 'https://huggingface.co/datasets/gossminn/wikibooks-cookbook/resolve/main/recipes_parsed.json?download=true';
const DATASET_SOURCE = 'Wikibooks Cookbook';
const DATASET_LICENSE = 'CC BY-SA 4.0';
const CONCURRENCY = Math.min(Math.max(Number(process.env.RECIPE_IMPORT_CONCURRENCY ?? 2), 1), 4);
const MIN_STEP_CHARS = 20;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function clean(value = '') {
  return String(value).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, ' ').trim();
}
function parseNumber(value) {
  const unicode = { '½': 0.5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 0.25, '¾': 0.75, '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8, '⅙': 1 / 6, '⅚': 5 / 6, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875 };
  let total = 0;
  let matched = false;
  for (const token of String(value ?? '').matchAll(/\d+(?:\.\d+)?|[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g)) {
    matched = true;
    total += token[0] in unicode ? unicode[token[0]] : Number(token[0]);
  }
  return matched && Number.isFinite(total) ? total : null;
}
function parseIngredient(raw) {
  const text = clean(raw).replace(/[•●]+/g, '').trim();
  const match = text.match(/^\s*((?:\d+(?:\.\d+)?\s*)?[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]|\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)\s*(.*)$/u);
  if (!match) return { name: text, quantity: 1, unit: 'as listed', measurementKind: 'text', scalingPolicy: 'manual' };
  const quantity = parseNumber(match[1]);
  if (!quantity || quantity <= 0) return { name: text, quantity: 1, unit: 'as listed', measurementKind: 'text', scalingPolicy: 'manual' };
  const rest = match[2].trim();
  const unit = rest.match(/^(kg|g|mg|lb|lbs|oz|ml|l|liter|litre|liters|litres|cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|clove|cloves|piece|pieces|can|cans|package|packages|slice|slices|pinch|pinches)\b[.]?\s+(.*)$/i);
  if (unit) return { name: unit[2].trim(), quantity, unit: unit[1].toLowerCase(), measurementKind: 'quantity', scalingPolicy: 'linear' };
  return { name: rest || text, quantity, unit: 'item', measurementKind: 'count', scalingPolicy: 'linear' };
}
function parseServings(value) {
  const match = String(value ?? '').match(/\d+(?:\.\d+)?/);
  return match ? Math.max(1, Math.min(100, Math.round(Number(match[0])))) : 2;
}
function parseRecipe(row) {
  const data = row?.recipe_data ?? row ?? {};
  const lines = Array.isArray(data.text_lines) ? data.text_lines : [];
  const title = clean(data.title || row.title || row.filename?.split('/').pop()?.replace(/\.html$/i, '') || 'Untitled Recipe');
  const ingredients = lines.filter((line) => line?.line_type === 'ul' && /ingredient/i.test(line.section || '')).map((line) => parseIngredient(line.text)).filter((item) => item.name);
  const steps = lines.filter((line) => line?.line_type === 'ol' && /procedure|direction|method|instruction|preparation/i.test(line.section || '')).map((line) => clean(line.text)).filter((text) => text.length >= MIN_STEP_CHARS);
  const paragraphs = lines.filter((line) => line?.line_type === 'p' && !/contributor|source/i.test(line.section || '')).map((line) => clean(line.text)).filter(Boolean);
  return { title, description: paragraphs[0] ?? null, servings: parseServings(data.infobox?.servings), sourceUrl: data.url || (title ? `https://en.wikibooks.org/wiki/Cookbook:${encodeURIComponent(title.replace(/ /g, '_'))}` : null), ingredients, steps };
}
async function fetchJson(url, attempts = 5) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'MYPA-RecipeImporter/1.0' } });
      if (!response.ok) throw new Error(`${response.status} ${url}`);
      return response.json();
    } catch (error) {
      last = error;
      if (i < attempts - 1) await sleep(700 * 2 ** i);
    }
  }
  throw last;
}
async function getOrCreateFood(tx, name) {
  const existing = await tx.foodItem.findFirst({ where: { userId: null, name } });
  if (existing) return existing;
  return tx.foodItem.create({ data: { id: randomUUID(), userId: null, name, category: 'recipe ingredient', verified: false, calories: 0, protein: 0, carbs: 0, fat: 0 } });
}
async function importRecipe(parsed) {
  if (!parsed.title || parsed.title === 'Untitled Recipe' || parsed.ingredients.length === 0 || parsed.steps.length === 0) {
    return { status: 'skipped', title: parsed.title, reason: 'missing title/ingredients/steps' };
  }
  return prisma.$transaction(async (tx) => {
    const existing = await tx.recipe.findFirst({ where: { userId: null, name: parsed.title } });
    const recipe = existing
      ? await tx.recipe.update({
          where: { id: existing.id },
          data: {
            description: parsed.description,
            servings: parsed.servings,
            verified: true,
            // Content import must never delete or reset release media.
          },
        })
      : await tx.recipe.create({
          data: {
            id: randomUUID(),
            userId: null,
            name: parsed.title,
            description: parsed.description,
            servings: parsed.servings,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            verified: true,
            imageUrl: null,
            imageSource: DATASET_SOURCE,
          },
        });

    await tx.recipeStep.deleteMany({ where: { recipeId: recipe.id } });
    await tx.recipeIngredient.deleteMany({ where: { recipeId: recipe.id } });

    for (const ingredient of parsed.ingredients) {
      const food = await getOrCreateFood(tx, ingredient.name);
      await tx.recipeIngredient.create({
        data: {
          id: randomUUID(),
          recipeId: recipe.id,
          foodId: food.id,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          measurementKind: ingredient.measurementKind,
          scalingPolicy: ingredient.scalingPolicy,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        },
      });
    }

    for (const [index, instruction] of parsed.steps.entries()) {
      await tx.recipeStep.create({
        data: {
          id: randomUUID(),
          recipeId: recipe.id,
          stepNumber: index + 1,
          instruction,
          sourceLicense: DATASET_LICENSE,
          sourceAttribution: `${DATASET_SOURCE}; ${parsed.sourceUrl}`,
        },
      });
    }

    return {
      status: 'imported',
      recipeId: recipe.id,
      ingredientCount: parsed.ingredients.length,
      stepCount: parsed.steps.length,
      mediaCount: await tx.recipeMedia.count({ where: { recipeId: recipe.id, status: 'approved' } }),
    };
  });
}
async function main() {
  const dataset = await fetchJson(DATASET_URL);
  if (!Array.isArray(dataset) || dataset.length === 0) throw new Error('Recipe source dataset is empty or invalid.');
  const offset = Math.max(0, Number(process.env.RECIPE_IMPORT_OFFSET ?? 0));
  const requestedLimit = process.env.RECIPE_IMPORT_LIMIT ? Math.max(1, Number(process.env.RECIPE_IMPORT_LIMIT)) : dataset.length;
  const batch = dataset.slice(offset, Math.min(dataset.length, offset + requestedLimit));
  if (batch.length === 0) throw new Error(`Recipe import offset ${offset} is beyond dataset size ${dataset.length}.`);
  const parsed = batch.map(parseRecipe);
  const results = new Array(parsed.length);
  let cursor = 0;
  const worker = async () => {
    while (true) {
      const index = cursor++;
      if (index >= parsed.length) return;
      try {
        results[index] = await importRecipe(parsed[index]);
      } catch (error) {
        results[index] = { status: 'failed', title: parsed[index].title, error: error instanceof Error ? error.message : String(error) };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, parsed.length) }, worker));
  const stats = {
    datasetRows: dataset.length,
    selectedRows: batch.length,
    imported: results.filter((r) => r?.status === 'imported').length,
    skipped: results.filter((r) => r?.status === 'skipped').length,
    failed: results.filter((r) => r?.status === 'failed').length,
    ingredientsImported: results.reduce((sum, r) => sum + Number(r?.ingredientCount || 0), 0),
    stepsImported: results.reduce((sum, r) => sum + Number(r?.stepCount || 0), 0),
  };
  console.log(JSON.stringify({ source: DATASET_SOURCE, license: DATASET_LICENSE, offset, limit: batch.length, ...stats }, null, 2));
  if (stats.imported === 0 || stats.failed > 0) process.exitCode = 1;
}
main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
