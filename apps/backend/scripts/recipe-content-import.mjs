import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DATASET_URL = process.env.RECIPE_DATASET_URL ??
  'https://huggingface.co/datasets/gossminn/wikibooks-cookbook/resolve/main/recipes_parsed.json?download=true';
const DATASET_SOURCE = 'Wikibooks Cookbook';
const DATASET_LICENSE = 'CC BY-SA 4.0';
const WIKIBOOKS_API = 'https://en.wikibooks.org/w/api.php';
const BATCH_SIZE = Math.min(Math.max(Number(process.env.RECIPE_IMPORT_BATCH_SIZE ?? 250), 1), 500);
const CONCURRENCY = Math.min(Math.max(Number(process.env.RECIPE_IMPORT_CONCURRENCY ?? 3), 1), 6);
const IMPORT_MEDIA = process.env.RECIPE_IMPORT_MEDIA !== '0';
const MAX_MEDIA_PER_RECIPE = Math.min(Math.max(Number(process.env.RECIPE_MAX_MEDIA ?? 4), 1), 4);
const MIN_STEP_CHARS = 20;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function decodeHtml(value = '') {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function normalize(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u0600-\u06ff]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseFraction(text) {
  const value = String(text).trim();
  const unicode = { '½': 0.5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 0.25, '¾': 0.75, '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8, '⅙': 1 / 6, '⅚': 5 / 6, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875 };
  let total = 0;
  let matched = false;
  for (const match of value.matchAll(/\d+(?:\.\d+)?|[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g)) {
    matched = true;
    total += match[0] in unicode ? unicode[match[0]] : Number(match[0]);
  }
  return matched ? total : null;
}

function parseIngredient(raw) {
  const text = decodeHtml(raw).replace(/[•●]+/g, '').trim();
  const leading = text.match(/^\s*((?:\d+(?:\.\d+)?\s*)?[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]|\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)\s*(.*)$/u);
  if (!leading) {
    return { name: text, quantity: 1, unit: 'as listed', measurementKind: 'text', scalingPolicy: 'manual' };
  }

  const quantity = parseFraction(leading[1]);
  if (quantity == null || !Number.isFinite(quantity) || quantity <= 0) {
    return { name: text, quantity: 1, unit: 'as listed', measurementKind: 'text', scalingPolicy: 'manual' };
  }

  let rest = leading[2].trim();
  const unitMatch = rest.match(/^(kg|g|mg|lb|lbs|oz|ml|l|liter|litre|liters|litres|cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|pint|pints|quart|quarts|gallon|gallons|clove|cloves|piece|pieces|can|cans|package|packages|slice|slices|pinch|pinches)\b[.]?\s+(.*)$/i);
  if (unitMatch) {
    return { name: unitMatch[2].trim(), quantity, unit: unitMatch[1].toLowerCase(), measurementKind: 'quantity', scalingPolicy: 'linear' };
  }
  return { name: rest || text, quantity, unit: 'item', measurementKind: 'count', scalingPolicy: 'linear' };
}

function parseServings(value) {
  const match = String(value ?? '').match(/\d+(?:\.\d+)?/);
  if (!match) return 2;
  const servings = Math.round(Number(match[0]));
  return Math.max(1, Math.min(100, servings));
}

function mapDifficulty(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 5;
  return Math.max(1, Math.min(10, Math.round(n * 2)));
}

function parseRecipe(row) {
  const data = row?.recipe_data ?? row ?? {};
  const lines = Array.isArray(data.text_lines) ? data.text_lines : [];
  const title = decodeHtml(data.title || row.title || row.filename?.split('/').pop()?.replace(/\.html$/i, '') || 'Untitled Recipe');
  const ingredients = lines.filter((line) => line?.line_type === 'ul' && /ingredient/i.test(line.section || '')).map((line) => parseIngredient(line.text)).filter((item) => item.name);
  const procedures = lines.filter((line) => line?.line_type === 'ol' && /procedure|direction|method|instruction|preparation/i.test(line.section || '')).map((line) => decodeHtml(line.text)).filter((text) => text.length >= MIN_STEP_CHARS);
  const paragraphs = lines.filter((line) => line?.line_type === 'p' && !/contributor|source/i.test(line.section || '')).map((line) => decodeHtml(line.text)).filter(Boolean);
  const description = paragraphs.find((text) => !/^from the original recipe contributor/i.test(text)) ?? null;
  const category = decodeHtml(String(data.infobox?.category || '').replace(/^\/wiki\/Category:/, '').replace(/_/g, ' ')) || 'general';
  const url = data.url || (title ? `https://en.wikibooks.org/wiki/Cookbook:${encodeURIComponent(title.replace(/ /g, '_'))}` : null);
  return {
    title,
    description,
    servings: parseServings(data.infobox?.servings),
    difficultyLevel: mapDifficulty(data.infobox?.difficulty),
    category,
    url,
    ingredients,
    procedures,
    timeText: decodeHtml(data.infobox?.time || ''),
  };
}

async function fetchJson(url, attempts = 5) {
  let last;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'MYPA-RecipeImporter/1.0 (local-first content pipeline)' } });
      if (!response.ok) throw new Error(`${response.status} ${url}`);
      return response.json();
    } catch (error) {
      last = error;
      await sleep(700 * 2 ** attempt);
    }
  }
  throw last;
}

async function loadDataset() {
  const response = await fetchJson(DATASET_URL);
  if (!Array.isArray(response)) throw new Error('Recipe dataset JSON was not an array.');
  return response;
}

function allowedImageLicense(meta = {}) {
  const short = decodeHtml(meta.LicenseShortName?.value || meta.LicenseShortName || '');
  const terms = decodeHtml(meta.UsageTerms?.value || meta.UsageTerms || '');
  const combined = `${short} ${terms}`;
  if (/non[- ]?commercial|\bNC\b|no derivatives|\bND\b/i.test(combined)) return null;
  if (/CC0|public domain|public-domain|PDM/i.test(combined)) return { name: 'CC0/Public Domain' };
  if (/CC BY-SA/i.test(combined)) return { name: 'CC BY-SA' };
  if (/CC BY/i.test(combined)) return { name: 'CC BY' };
  return null;
}

async function fetchWikibooksMedia(pageUrl) {
  if (!pageUrl) return [];
  const title = decodeURIComponent(pageUrl.split('/wiki/')[1] || '').replace(/_/g, ' ');
  if (!title) return [];
  const params = new URLSearchParams({
    action: 'query',
    titles: title,
    prop: 'images|imageinfo',
    imlimit: String(Math.min(MAX_MEDIA_PER_RECIPE * 3, 12)),
    iilimit: String(Math.min(MAX_MEDIA_PER_RECIPE * 3, 12)),
    iiprop: 'url|extmetadata',
    iiurlwidth: '1200',
    format: 'json',
    formatversion: '2',
  });
  const data = await fetchJson(`${WIKIBOOKS_API}?${params.toString()}`);
  const page = data?.query?.pages?.[0];
  const images = page?.images || [];
  const media = [];
  for (const image of images) {
    const fileTitle = image.title || '';
    if (!/^File:/i.test(fileTitle) || /\.svg$|\.gif$|\.ico$/i.test(fileTitle)) continue;
    const infoParams = new URLSearchParams({
      action: 'query',
      titles: fileTitle,
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: '1200',
      format: 'json',
      formatversion: '2',
    });
    const detail = await fetchJson(`${WIKIBOOKS_API}?${infoParams.toString()}`);
    const info = detail?.query?.pages?.[0]?.imageinfo?.[0];
    if (!info?.thumburl && !info?.url) continue;
    const meta = info.extmetadata || {};
    const license = allowedImageLicense(meta);
    if (!license) continue;
    media.push({
      url: info.thumburl || info.url,
      sourceUrl: info.descriptionurl || info.url,
      provider: 'Wikimedia Commons/Wikibooks',
      license: license.name,
      attribution: `${decodeHtml(meta.Artist?.value || meta.Credit?.value || 'Wikimedia contributor')}; ${license.name}`,
    });
    if (media.length >= MAX_MEDIA_PER_RECIPE) break;
    await sleep(100);
  }
  return media;
}

async function getOrCreateFood(ingredient) {
  const key = normalize(ingredient.name);
  const existing = await prisma.foodItem.findFirst({ where: { userId: null, name: ingredient.name } });
  if (existing) return existing;
  return prisma.foodItem.create({
    data: {
      id: randomUUID(),
      userId: null,
      name: ingredient.name,
      category: 'recipe ingredient',
      verified: false,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      imageUrl: null,
      imageSource: null,
    },
  });
}

async function importRecipe(parsed) {
  if (!parsed.title) return { status: 'skipped', reason: 'missing title' };
  const existing = await prisma.recipe.findFirst({ where: { userId: null, name: parsed.title } });
  const recipe = existing
    ? await prisma.recipe.update({
        where: { id: existing.id },
        data: { description: parsed.description, servings: parsed.servings, verified: false },
      })
    : await prisma.recipe.create({
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
          verified: false,
        },
      });

  await prisma.recipeStep.deleteMany({ where: { recipeId: recipe.id } });
  await prisma.recipeIngredient.deleteMany({ where: { recipeId: recipe.id } });

  let ingredientCount = 0;
  for (const ingredient of parsed.ingredients) {
    const food = await getOrCreateFood(ingredient);
    await prisma.recipeIngredient.create({
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
    ingredientCount += 1;
  }

  let stepCount = 0;
  for (const [index, instruction] of parsed.procedures.entries()) {
    await prisma.recipeStep.create({
      data: {
        id: randomUUID(),
        recipeId: recipe.id,
        stepNumber: index + 1,
        instruction,
        sourceLicense: DATASET_LICENSE,
        sourceAttribution: `${DATASET_SOURCE}; source page: ${parsed.url}`,
      },
    });
    stepCount += 1;
  }

  let mediaCount = 0;
  if (IMPORT_MEDIA) {
    await prisma.recipeMedia.deleteMany({ where: { recipeId: recipe.id } });
    try {
      const media = await fetchWikibooksMedia(parsed.url);
      for (const [index, item] of media.entries()) {
        await prisma.recipeMedia.create({
          data: {
            id: randomUUID(),
            recipeId: recipe.id,
            position: index,
            url: item.url,
            sourceUrl: item.sourceUrl,
            sourceProvider: item.provider,
            license: item.license,
            attribution: `${item.attribution}; recipe source: ${parsed.url}`,
            mimeType: 'image/webp',
            status: 'approved',
          },
        });
        mediaCount += 1;
      }
      if (mediaCount > 0) {
        await prisma.recipe.update({ where: { id: recipe.id }, data: { imageUrl: media[0].url, imageSource: `${media[0].provider}; ${media[0].license}` } });
      }
    } catch (error) {
      console.error(`[MEDIA] ${recipe.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { status: 'imported', recipeId: recipe.id, ingredientCount, stepCount, mediaCount };
}

async function mapConcurrent(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function runner() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      try { results[index] = await worker(items[index]); }
      catch (error) { results[index] = { status: 'failed', error: error instanceof Error ? error.message : String(error) }; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => runner()));
  return results;
}

async function main() {
  const dataset = await loadDataset();
  const batch = dataset.slice(0, BATCH_SIZE);
  const parsed = batch.map(parseRecipe);
  const results = await mapConcurrent(parsed, CONCURRENCY, importRecipe);
  const stats = {
    datasetRows: dataset.length,
    batchRows: batch.length,
    imported: results.filter((item) => item?.status === 'imported').length,
    skipped: results.filter((item) => item?.status === 'skipped').length,
    failed: results.filter((item) => item?.status === 'failed').length,
    mediaImported: results.reduce((sum, item) => sum + Number(item?.mediaCount || 0), 0),
    stepsImported: results.reduce((sum, item) => sum + Number(item?.stepCount || 0), 0),
  };
  console.log(JSON.stringify({ source: DATASET_SOURCE, license: DATASET_LICENSE, importMedia: IMPORT_MEDIA, ...stats }, null, 2));
  if (stats.failed > 0 && stats.imported === 0) process.exitCode = 1;
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
