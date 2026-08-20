import { resolveFoodEntity } from './food-entity-resolver-final.mjs';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const rawLimit = process.env.RECIPE_FOOD_ENTITY_LIMIT ?? process.env.RECIPE_COUNTRY_LIMIT ?? '0';
const parsedLimit = Number(rawLimit);
const LIMIT = Number.isFinite(parsedLimit) && parsedLimit >= 0 ? Math.floor(parsedLimit) : 0;
const TOP = Math.max(1, Math.min(Number(process.env.RECIPE_FOOD_ENTITY_AUDIT_TOP || '250'), 1000));

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
    const parsed = JSON.parse(String(v).replace(/'/g, '"'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(v).split(/\n+/).map((x) => x.trim()).filter(Boolean);
  }
}

function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const recipes = await allRows('recipes', 'id,name', 'created_at.asc');
const raws = await allRows('recipe_source_raw', 'recipe_id,raw_ingredients', 'created_at.asc');
const byId = new Map(raws.map((x) => [x.recipe_id, parseRaw(x.raw_ingredients)]));
const selected = LIMIT === 0 ? recipes : recipes.slice(0, LIMIT);

const unresolved = new Map();
let parts = 0;
let resolved = 0;
for (const recipe of selected) {
  for (const line of byId.get(recipe.id) || []) {
    parts++;
    const raw = String(line);
    const result = resolveFoodEntity(raw);
    if (result.canonical_id) {
      resolved++;
      continue;
    }
    const key = normalizeKey(result.normalized || raw);
    const entry = unresolved.get(key) || { normalized: key, count: 0, examples: [], recipes: 0, reasons: new Set() };
    entry.count++;
    entry.recipes++;
    if (entry.examples.length < 5 && !entry.examples.includes(raw)) entry.examples.push(raw);
    entry.reasons.add(result.reason || 'unresolved_offline');
    unresolved.set(key, entry);
  }
}

const top = [...unresolved.values()]
  .sort((a, b) => b.count - a.count || a.normalized.localeCompare(b.normalized))
  .slice(0, TOP)
  .map((item) => ({ ...item, reasons: [...item.reasons].sort() }));

console.log(JSON.stringify({
  status: 'complete',
  mode: 'audit',
  limit: LIMIT,
  processed: selected.length,
  totalRecipes: recipes.length,
  totalSourceParts: parts,
  resolvedParts: resolved,
  unresolvedParts: parts - resolved,
  coverage: parts ? Number((resolved / parts).toFixed(4)) : 0,
  uniqueUnresolved: unresolved.size,
  top,
  version: 'food-entity-unresolved-audit-v1',
}, null, 2));
