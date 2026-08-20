import { resolveFoodEntity, FOOD_ENTITY_RESOLVER_VERSION } from './food-entity-resolver-final.mjs';
import { resolveLocalizedFoodEntity } from './localized-food-entity-resolver-final.mjs';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LIMIT = Math.max(Number(process.env.RECIPE_FOOD_ENTITY_LIMIT || '0'), 0);
const BATCH = Math.min(Math.max(Number(process.env.RECIPE_FOOD_ENTITY_BATCH || '200'), 25), 500);
const DRY_RUN = /^(1|true|yes)$/i.test(process.env.RECIPE_FOOD_ENTITY_DRY_RUN || 'false');
const LOCALE = process.env.RECIPE_FOOD_ENTITY_LOCALE || null;
const VERSION = 'recipe-food-entity-intelligence-v3-final';

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

function parseRaw(value) {
  if (Array.isArray(value)) return value.map(String).map((x) => x.trim()).filter(Boolean);
  if (!value) return [];
  const text = String(value).trim();
  try {
    const parsed = JSON.parse(text.replace(/'/g, '"'));
    return Array.isArray(parsed) ? parsed.map(String).map((x) => x.trim()).filter(Boolean) : [text];
  } catch {
    return [text.replace(/^\[/, '').replace(/\]$/, '').trim()].filter(Boolean);
  }
}

function resolveLine(line) {
  const direct = LOCALE ? resolveLocalizedFoodEntity(line, { locale: LOCALE }) : resolveFoodEntity(line);
  if (direct.canonical_id && !direct.review_required) return [direct];
  const pieces = line.split(/\s*[,;]\s*/).map((x) => x.trim()).filter(Boolean);
  if (pieces.length >= 2 && pieces.length <= 4) {
    const split = pieces.map((piece) => resolveFoodEntity(piece));
    if (split.every((item) => item.canonical_id && !item.review_required)) return split;
  }
  return [direct];
}

function analyzeRecipe(recipe, rawValue) {
  const lines = parseRaw(rawValue);
  const entities = lines.flatMap(resolveLine);
  const unresolved = entities.filter((item) => !item.canonical_id || item.review_required);
  return {
    version: VERSION,
    resolver_version: FOOD_ENTITY_RESOLVER_VERSION,
    recipe_id: recipe.id,
    recipe_name: recipe.name,
    locale: LOCALE,
    source_line_count: lines.length,
    entity_count: entities.length,
    canonical_ids: [...new Set(entities.map((item) => item.canonical_id).filter(Boolean))],
    entities,
    unresolved_count: unresolved.length,
    unresolved,
    coverage: entities.length ? Number(((entities.length - unresolved.length) / entities.length).toFixed(4)) : 1,
    review_required: unresolved.length > 0,
  };
}

async function patchProfile(recipeId, analysis) {
  const existing = await rest(`recipe_intelligence_profiles?recipe_id=eq.${recipeId}&select=evidence&limit=1`);
  const currentEvidence = existing?.[0]?.evidence && typeof existing[0].evidence === 'object' ? existing[0].evidence : {};
  const evidence = { ...currentEvidence, food_entity_intelligence: analysis };
  await rest(`recipe_intelligence_profiles?recipe_id=eq.${recipeId}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ source: VERSION, evidence }) });
}

async function main() {
  let recipes = await allRows('recipes', 'id,name', 'created_at.asc');
  if (LIMIT > 0) recipes = recipes.slice(0, LIMIT);
  const raws = await allRows('recipe_source_raw', 'recipe_id,raw_ingredients', 'created_at.asc');
  const rawByRecipe = new Map(raws.map((row) => [row.recipe_id, row.raw_ingredients]));

  let processed = 0;
  let withIngredients = 0;
  let fullyResolved = 0;
  let unresolvedEntities = 0;
  let entityCount = 0;

  for (let i = 0; i < recipes.length; i += BATCH) {
    for (const recipe of recipes.slice(i, i + BATCH)) {
      const analysis = analyzeRecipe(recipe, rawByRecipe.get(recipe.id));
      if (analysis.source_line_count) withIngredients += 1;
      if (analysis.review_required) unresolvedEntities += analysis.unresolved_count;
      else fullyResolved += 1;
      entityCount += analysis.entity_count;
      if (!DRY_RUN) await patchProfile(recipe.id, analysis);
      processed += 1;
    }
    console.log(JSON.stringify({ progress: processed, total: recipes.length, withIngredients, fullyResolved, unresolvedEntities, entityCount }, null, 2));
  }

  console.log(JSON.stringify({ status: 'complete', mode: DRY_RUN ? 'dry-run' : 'apply', processed, total: recipes.length, withIngredients, fullyResolved, unresolvedEntities, entityCount, resolverVersion: FOOD_ENTITY_RESOLVER_VERSION, version: VERSION }, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); });
