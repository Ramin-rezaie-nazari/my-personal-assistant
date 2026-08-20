import { analyzeIngredientLine } from './ingredient-taxonomy-engine.mjs';

const LIMIT = Math.max(Number(process.env.RECIPE_INGREDIENT_AUDIT_LIMIT || '0'), 0);
const TOP = Math.min(Math.max(Number(process.env.RECIPE_INGREDIENT_AUDIT_TOP || '250'), 1), 1000);
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function rest(path) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
    const text = await response.text();
    if (response.ok) return text ? JSON.parse(text) : null;
    if (response.status === 429 || response.status >= 500) { await sleep(500 * 2 ** attempt); continue; }
    throw new Error(`${response.status} ${path}: ${text}`);
  }
  throw new Error('Audit request failed after retries.');
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
  let recipes = await allRows('recipes', 'id,name', 'created_at.asc');
  const raws = await allRows('recipe_source_raw', 'recipe_id,raw_ingredients', 'created_at.asc');
  const rawByRecipe = new Map(raws.map((row) => [row.recipe_id, parseSourceIngredients(row.raw_ingredients)]));
  if (LIMIT > 0) recipes = recipes.slice(0, LIMIT);

  const counts = new Map();
  for (const recipe of recipes) {
    for (const raw of rawByRecipe.get(recipe.id) || []) {
      const result = analyzeIngredientLine(raw);
      if (result.category === 'unknown') {
        const key = result.normalized_text || '(empty)';
        const entry = counts.get(key) || { normalized: key, count: 0, examples: new Set(), reasons: new Set() };
        entry.count += 1;
        if (entry.examples.size < 5) entry.examples.add(String(raw));
        entry.reasons.add(result.reason);
        counts.set(key, entry);
      }
    }
  }

  const top = [...counts.values()]
    .sort((a, b) => b.count - a.count || a.normalized.localeCompare(b.normalized))
    .slice(0, TOP)
    .map((item) => ({ ...item, examples: [...item.examples], reasons: [...item.reasons] }));

  console.log(JSON.stringify({ status: 'complete', recipesProcessed: recipes.length, uniqueUnknowns: counts.size, topUnknowns: top }, null, 2));
}
main().catch((error) => { console.error(error); process.exit(1); });
