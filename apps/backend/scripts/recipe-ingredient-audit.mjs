import { analyzeIngredientLine, taxonomyIntegrity } from './ingredient-taxonomy-engine.mjs';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LIMIT = Math.max(Number(process.env.RECIPE_INGREDIENT_LIMIT || '0'), 0);
const TOP = Math.min(Math.max(Number(process.env.RECIPE_INGREDIENT_AUDIT_TOP || '250'), 10), 2000);

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');

const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function rest(path, attempts = 6) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
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
    const parsed = JSON.parse(text.replace(/'/g, '\"'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return text.replace(/^\[/, '').replace(/\]$/, '').split(/\s*;\s*/).map((item) => item.replace(/^['\"]|['\"]$/g, '').trim()).filter(Boolean);
  }
}

async function main() {
  const integrity = taxonomyIntegrity();
  if (!integrity.valid) throw new Error(`Ingredient taxonomy integrity failed: ${JSON.stringify(integrity)}`);

  let recipes = await allRows('recipes', 'id,name', 'created_at.asc');
  if (LIMIT > 0) recipes = recipes.slice(0, LIMIT);
  const raws = await allRows('recipe_source_raw', 'recipe_id,raw_ingredients', 'created_at.asc');
  const rawByRecipe = new Map(raws.map((row) => [row.recipe_id, parseSourceIngredients(row.raw_ingredients)]));

  const unresolved = new Map();
  let resolved = 0;
  let nonIngredient = 0;
  let totalParts = 0;
  let recipesWithRaw = 0;

  for (const recipe of recipes) {
    const rawLines = rawByRecipe.get(recipe.id) || [];
    if (rawLines.length) recipesWithRaw += 1;
    for (const rawLine of rawLines) {
      if (!String(rawLine || '').trim()) continue;
      totalParts += 1;
      const analysis = analyzeIngredientLine(rawLine);
      if (analysis.non_ingredient) {
        nonIngredient += 1;
        continue;
      }
      if (analysis.review_required || analysis.category === 'unknown') {
        const key = analysis.normalized_text || String(rawLine).toLowerCase();
        const current = unresolved.get(key) || { normalized: key, count: 0, examples: [], reasons: new Set() };
        current.count += 1;
        current.reasons.add(analysis.reason);
        if (current.examples.length < 5 && !current.examples.includes(rawLine)) current.examples.push(rawLine);
        unresolved.set(key, current);
      } else {
        resolved += 1;
      }
    }
  }

  const top = [...unresolved.values()]
    .sort((a, b) => b.count - a.count || a.normalized.localeCompare(b.normalized))
    .slice(0, TOP)
    .map((item) => ({ ...item, reasons: [...item.reasons].sort() }));

  console.log(JSON.stringify({
    status: 'complete',
    mode: 'audit',
    recipesProcessed: recipes.length,
    recipesWithRaw,
    totalParts,
    resolvedParts: resolved,
    nonIngredientParts: nonIngredient,
    unresolvedParts: unresolved.size ? top.reduce((sum, item) => sum + item.count, 0) : 0,
    unresolvedUnique: unresolved.size,
    top,
    taxonomyEntries: integrity.entries,
  }, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); });
