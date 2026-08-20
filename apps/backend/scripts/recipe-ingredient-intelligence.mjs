import { analyzeRecipeIngredients, TAXONOMY_VERSION, taxonomyIntegrity } from './ingredient-taxonomy-engine.mjs';
import { classifyNonFoodPart } from './ingredient-non-food-classifier.mjs';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LIMIT = Math.max(Number(process.env.RECIPE_INGREDIENT_LIMIT || '0'), 0);
const BATCH = Math.min(Math.max(Number(process.env.RECIPE_INGREDIENT_BATCH || '200'), 25), 500);
const DRY_RUN = /^(1|true|yes)$/i.test(process.env.RECIPE_INGREDIENT_DRY_RUN || 'false');
const VERSION = 'ingredient-intelligence-v2';

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');

const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function rest(path, options = {}, attempts = 6) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
      const text = await response.text();
      if (response.ok) return text ? JSON.parse(text) : null;
      if (response.status === 429 || response.status >= 500) { await sleep(500 * 2 ** attempt); continue; }
      throw new Error(`${response.status} ${path}: ${text}`);
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) await sleep(500 * 2 ** attempt);
    }
  }
  throw lastError;
}

async function allRows(table, select, order = 'id.asc') {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await rest(`${table}?select=${select}&order=${order}&limit=1000&offset=${offset}`);
    rows.push(...(page || []));
    if (!page || page.length < 1000) return rows;
  }
}

function parseSourceIngredients(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  const text = String(value).trim();
  try {
    const parsed = JSON.parse(text.replace(/'/g, '"'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return text.replace(/^\[/, '').replace(/\]$/, '').split(/\s*[,;]\s*/).map((item) => item.trim()).filter(Boolean);
  }
}

function enrichAnalysis(analysis) {
  const nonIngredientParts = analysis.unresolved
    .map((item) => ({ ...item, classification: classifyNonFoodPart(item.raw) }))
    .filter((item) => item.classification)
    .map(({ raw, classification }) => ({ raw, ...classification }));
  const unresolvedIngredientParts = analysis.unresolved.filter((item) => !classifyNonFoodPart(item.raw));
  const sourcePartCount = analysis.analyzed_count + analysis.unresolved_count;
  const classifiedPartCount = analysis.analyzed_count + nonIngredientParts.length;

  return {
    ...analysis,
    source_part_count: sourcePartCount,
    classified_part_count: classifiedPartCount,
    resolved_ingredient_count: analysis.analyzed_count,
    non_ingredient_count: nonIngredientParts.length,
    unresolved_ingredient_count: unresolvedIngredientParts.length,
    unresolved: unresolvedIngredientParts,
    non_ingredient_parts: nonIngredientParts,
    ingredient_coverage: (analysis.analyzed_count + unresolvedIngredientParts.length) > 0
      ? Number((analysis.analyzed_count / (analysis.analyzed_count + unresolvedIngredientParts.length)).toFixed(4))
      : 1,
    classification_coverage: sourcePartCount ? Number((classifiedPartCount / sourcePartCount).toFixed(4)) : 1,
    review_required: unresolvedIngredientParts.length > 0,
  };
}

async function patchProfile(recipeId, analysis) {
  const existing = await rest(`recipe_intelligence_profiles?recipe_id=eq.${recipeId}&select=evidence&limit=1`);
  const currentEvidence = existing?.[0]?.evidence && typeof existing[0].evidence === 'object' ? existing[0].evidence : {};
  const evidence = {
    ...currentEvidence,
    ingredient_intelligence: {
      ...analysis,
      engine_version: VERSION,
      taxonomy_version: TAXONOMY_VERSION,
    },
  };
  await rest(`recipe_intelligence_profiles?recipe_id=eq.${recipeId}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ source: VERSION, evidence }),
  });
}

async function main() {
  const integrity = taxonomyIntegrity();
  if (!integrity.valid) throw new Error(`Ingredient taxonomy integrity failed: ${JSON.stringify(integrity)}`);

  let recipes = await allRows('recipes', 'id,name', 'created_at.asc');
  if (LIMIT > 0) recipes = recipes.slice(0, LIMIT);
  const raws = await allRows('recipe_source_raw', 'recipe_id,raw_ingredients', 'created_at.asc');
  const rawByRecipe = new Map(raws.map((row) => [row.recipe_id, parseSourceIngredients(row.raw_ingredients)]));

  let processed = 0;
  let withRawIngredients = 0;
  let totalSourceParts = 0;
  let resolvedIngredientParts = 0;
  let nonIngredientParts = 0;
  let unresolvedIngredientParts = 0;
  let fullyCoveredRecipes = 0;
  let partiallyCoveredRecipes = 0;
  let noIngredientRecipes = 0;

  for (let i = 0; i < recipes.length; i += BATCH) {
    for (const recipe of recipes.slice(i, i + BATCH)) {
      const analysis = enrichAnalysis(analyzeRecipeIngredients(rawByRecipe.get(recipe.id) || []));
      if (analysis.raw_count) {
        withRawIngredients += 1;
        totalSourceParts += analysis.source_part_count;
        resolvedIngredientParts += analysis.resolved_ingredient_count;
        nonIngredientParts += analysis.non_ingredient_count;
        unresolvedIngredientParts += analysis.unresolved_ingredient_count;
        if (analysis.unresolved_ingredient_count === 0) fullyCoveredRecipes += 1;
        else partiallyCoveredRecipes += 1;
      } else {
        noIngredientRecipes += 1;
        fullyCoveredRecipes += 1;
      }
      if (!DRY_RUN) await patchProfile(recipe.id, analysis);
      processed += 1;
    }
    console.log(JSON.stringify({
      progress: processed,
      total: recipes.length,
      withRawIngredients,
      totalSourceParts,
      resolvedIngredientParts,
      nonIngredientParts,
      unresolvedIngredientParts,
      fullyCoveredRecipes,
      partiallyCoveredRecipes,
      noIngredientRecipes,
    }, null, 2));
  }

  console.log(JSON.stringify({
    status: 'complete',
    mode: DRY_RUN ? 'dry-run' : 'apply',
    processed,
    total: recipes.length,
    withRawIngredients,
    noIngredientRecipes,
    totalSourceParts,
    resolvedIngredientParts,
    nonIngredientParts,
    unresolvedIngredientParts,
    classifiedParts: resolvedIngredientParts + nonIngredientParts,
    ingredientPartCoverage: totalSourceParts ? Number((resolvedIngredientParts / Math.max(1, resolvedIngredientParts + unresolvedIngredientParts)).toFixed(4)) : 1,
    classificationCoverage: totalSourceParts ? Number(((resolvedIngredientParts + nonIngredientParts) / totalSourceParts).toFixed(4)) : 1,
    fullyCoveredRecipes,
    partiallyCoveredRecipes,
    taxonomyEntries: integrity.entries,
    version: VERSION,
  }, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); });
