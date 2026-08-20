import { resolveFoodEntity } from './food-entity-resolver.mjs';
import { resolveLocalizedFoodEntity } from './localized-food-entity-resolver.mjs';
import { FOOD_ENTITY_RESOLVER_VERSION } from './food-entity-resolver.mjs';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LIMIT = Math.max(Number(process.env.RECIPE_FOOD_ENTITY_LIMIT || '0'), 0);
const DRY_RUN = /^(1|true|yes)$/i.test(process.env.RECIPE_FOOD_ENTITY_DRY_RUN || 'false');
const BATCH = Math.min(Math.max(Number(process.env.RECIPE_FOOD_ENTITY_BATCH || '200'), 25), 500);
const VERSION = 'recipe-food-entity-intelligence-v1';

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

async function allRows(table, select, order = 'created_at.asc') {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await rest(`${table}?select=${select}&order=${order}&limit=1000&offset=${offset}`);
    rows.push(...(page || []));
    if (!page || page.length < 1000) return rows;
  }
}

function parseSourceIngredients(value) {
  if (Array.isArray(value)) return value.map(String).map((x) => x.trim()).filter(Boolean);
  if (!value) return [];
  const text = String(value).trim();
  try {
    const parsed = JSON.parse(text.replace(/'/g, '"'));
    return Array.isArray(parsed) ? parsed.map(String).map((x) => x.trim()).filter(Boolean) : [];
  } catch {
    return [text.replace(/^\[/, '').replace(/\]$/, '').trim()].filter(Boolean);
  }
}

function trySplitLine(line) {
  const separators = /\s*[,;]\s*/;
  if (!separators.test(line)) return null;
  const pieces = line.split(separators).map((x) => x.trim()).filter(Boolean);
  if (pieces.length < 2 || pieces.length > 5) return null;
  const resolved = pieces.map((piece) => resolveFoodEntity(piece));
  if (resolved.every((item) => item.canonical_id && !item.review_required)) return resolved;
  return null;
}

function resolveSourceLine(line, locale = null) {
  const localized = locale ? resolveLocalizedFoodEntity(line, { locale }) : resolveFoodEntity(line);
  if (localized.canonical_id && !localized.review_required) return [localized];
  const split = trySplitLine(line);
  return split || [localized];
}

function analyzeRecipe(recipe, rawIngredients, locale) {
  const sourceLines = parseSourceIngredients(rawIngredients);
  const entities = sourceLines.flatMap((line) => resolveSourceLine(line, locale));
  const canonicalIds = [...new Set(entities.map((x) => x.canonical_id).filter(Boolean))];
  const unresolved = entities.filter((x) => !x.canonical_id || x.review_required);
  return {
    resolver_version: FOOD_ENTITY_RESOLVER_VERSION,
    pipeline_version: VERSION,
    recipe_id: recipe.id,
    recipe_name: recipe.name,
    source_line_count: sourceLines.length,
    entity_count: entities.length,
    canonical_ids: canonicalIds,
    entities,
    unresolved_count: unresolved.length,
    unresolved,
    confidence: entities.length ? Number((entities.reduce((sum, x) => sum + (x.confidence || 0), 0) / entities.length).toFixed(3)) : 0,
    review_required: unresolved.length > 0,
  };
}

async function patchProfile(recipeId, analysis) {
  const existing = await rest(`recipe_intelligence_profiles?recipe_id=eq.${recipeId}&select=evidence&limit=1`);
  const currentEvidence = existing?.[0]?.evidence && typeof existing[0].evidence === 'object' ? existing[0].evidence : {};
  const evidence = { ...currentEvidence, food_entity_intelligence: analysis };
  await rest(`recipe_intelligence_profiles?recipe_id=eq.${recipeId}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ source: VERSION, evidence }),
  });
}

async function main() {
  let recipes = await allRows('recipes', 'id,name', 'created_at.asc');
  if (LIMIT > 0) recipes = recipes.slice(0, LIMIT);
  const raws = await allRows('recipe_source_raw', 'recipe_id,raw_ingredients', 'created_at.asc');
  const rawByRecipe = new Map(raws.map((row) => [row.recipe_id, row.raw_ingredients]));

  let processed = 0;
  let withIngredients = 0;
  let resolvedLines = 0;
  let entityCount = 0;
  let unresolvedEntities = 0;
  let fullyResolvedRecipes = 0;

  for (let i = 0; i < recipes.length; i += BATCH) {
    for (const recipe of recipes.slice(i, i + BATCH)) {
      const analysis = analyzeRecipe(recipe, rawByRecipe.get(recipe.id), process.env.RECIPE_FOOD_ENTITY_LOCALE || null);
      if (analysis.source_line_count) withIngredients += 1;
      if (analysis.review_required) unresolvedEntities += analysis.unresolved_count;
      else fullyResolvedRecipes += 1;
      resolvedLines += analysis.source_line_count - analysis.unresolved_count;
      entityCount += analysis.entity_count;
      if (!DRY_RUN) await patchProfile(recipe.id, analysis);
      processed += 1;
    }
    console.log(JSON.stringify({ progress: processed, total: recipes.length, withIngredients, resolvedLines, entityCount, unresolvedEntities, fullyResolvedRecipes }, null, 2));
  }

  console.log(JSON.stringify({
    status: 'complete',
    mode: DRY_RUN ? 'dry-run' : 'apply',
    processed,
    total: recipes.length,
    withIngredients,
    resolvedLines,
    entityCount,
    unresolvedEntities,
    fullyResolvedRecipes,
    resolverVersion: FOOD_ENTITY_RESOLVER_VERSION,
    version: VERSION,
  }, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); });
