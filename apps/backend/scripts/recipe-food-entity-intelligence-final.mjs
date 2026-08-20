import { resolveFoodEntity } from './food-entity-resolver-final.mjs';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const rawLimit = process.env.RECIPE_FOOD_ENTITY_LIMIT ?? process.env.RECIPE_COUNTRY_LIMIT ?? '20';
const parsedLimit = Number(rawLimit);
const LIMIT = Number.isFinite(parsedLimit) && parsedLimit >= 0 ? Math.floor(parsedLimit) : 20;

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

async function rest(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${path}: ${t}`);
  return t ? JSON.parse(t) : null;
}

async function allRows(table, select, order = 'id.asc') {
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await rest(`${table}?select=${select}&order=${order}&limit=1000&offset=${offset}`);
    out.push(...(page || []));
    if (!page || page.length < 1000) return out;
  }
}

function parseRaw(v) {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  try {
    const p = JSON.parse(String(v).replace(/'/g, '"'));
    return Array.isArray(p) ? p : [];
  } catch {
    return String(v).split(/\n+/).map((x) => x.trim()).filter(Boolean);
  }
}

const recipes = await allRows('recipes', 'id,name', 'created_at.asc');
const raws = await allRows('recipe_source_raw', 'recipe_id,raw_ingredients', 'created_at.asc');
const byId = new Map(raws.map((x) => [x.recipe_id, parseRaw(x.raw_ingredients)]));
const selected = LIMIT === 0 ? recipes : recipes.slice(0, LIMIT);

let parts = 0;
let resolved = 0;
let review = 0;

for (const recipe of selected) {
  for (const line of byId.get(recipe.id) || []) {
    const r = resolveFoodEntity(String(line));
    parts++;
    if (r.canonical_id) resolved++;
    else review++;
  }
}

console.log(JSON.stringify({
  status: 'complete',
  mode: 'dry-run',
  limit: LIMIT,
  processed: selected.length,
  total: recipes.length,
  totalSourceParts: parts,
  resolvedParts: resolved,
  reviewRequiredParts: review,
  coverage: parts ? Number((resolved / parts).toFixed(4)) : 0,
  version: 'food-entity-intelligence-final-v2',
}, null, 2));
