import { resolveFoodEntity } from './food-entity-resolver-final.mjs';
import { classifyNonFoodPart } from './ingredient-non-food-classifier.mjs';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const rawLimit = process.env.RECIPE_FOOD_ENTITY_LIMIT ?? process.env.RECIPE_COUNTRY_LIMIT ?? '20';
const parsedLimit = Number(rawLimit);
const LIMIT = Number.isFinite(parsedLimit) && parsedLimit >= 0 ? Math.floor(parsedLimit) : 20;
const AUDIT = String(process.env.RECIPE_FOOD_ENTITY_AUDIT || '').toLowerCase() === 'true';

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

function splitQuotedList(value) {
  const text = String(value || '').trim().replace(/^\[|\]$/g, '');
  const out = [];
  let current = '';
  let quote = null;
  let escaped = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (escaped) { current += ch; escaped = false; continue; }
    if (ch === '\\') { current += ch; escaped = true; continue; }
    if ((ch === "'" || ch === '"') && (quote === null || quote === ch)) {
      if (quote === ch && next === ch) { current += ch; i += 1; continue; }
      quote = quote === ch ? null : ch;
      continue;
    }
    if (ch === ',' && quote === null) {
      const item = current.trim().replace(/^['\"]|['\"]$/g, '').trim();
      if (item) out.push(item);
      current = '';
      continue;
    }
    current += ch;
  }
  const last = current.trim().replace(/^['\"]|['\"]$/g, '').trim();
  if (last) out.push(last);
  return out;
}

function parseRaw(v) {
  if (Array.isArray(v)) return v.map(String).map((x) => x.trim()).filter(Boolean);
  if (!v) return [];
  const raw = String(v).trim();
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String).map((x) => x.trim()).filter(Boolean);
  } catch {
    // fall through
  }
  if (raw.startsWith('[') && raw.endsWith(']')) return splitQuotedList(raw);
  return raw.split(/\n+/).map((x) => x.trim()).filter(Boolean);
}

const recipes = await allRows('recipes', 'id,name', 'created_at.asc');
const raws = await allRows('recipe_source_raw', 'recipe_id,raw_ingredients', 'created_at.asc');
const byId = new Map(raws.map((x) => [x.recipe_id, parseRaw(x.raw_ingredients)]));
const selected = LIMIT === 0 ? recipes : recipes.slice(0, LIMIT);

let parts = 0;
let resolved = 0;
let review = 0;
let nonIngredient = 0;
const unresolved = new Map();

for (const recipe of selected) {
  for (const line of byId.get(recipe.id) || []) {
    const rawLine = String(line);
    const nonFood = classifyNonFoodPart(rawLine);
    if (nonFood) { nonIngredient += 1; continue; }
    const r = resolveFoodEntity(rawLine);
    parts += 1;
    if (r.canonical_id) resolved += 1;
    else {
      review += 1;
      if (AUDIT) {
        const key = r.normalized || rawLine.toLowerCase().trim();
        const existing = unresolved.get(key) || { normalized: key, count: 0, examples: [], recipes: 0, reasons: new Set() };
        existing.count += 1;
        existing.recipes += 1;
        if (existing.examples.length < 5 && !existing.examples.includes(rawLine)) existing.examples.push(rawLine);
        existing.reasons.add(r.reason || 'unresolved_offline');
        unresolved.set(key, existing);
      }
    }
  }
}

const result = {
  status: 'complete',
  mode: 'dry-run',
  limit: LIMIT,
  processed: selected.length,
  total: recipes.length,
  totalSourceParts: parts,
  nonIngredientParts: nonIngredient,
  resolvedParts: resolved,
  reviewRequiredParts: review,
  coverage: parts ? Number((resolved / parts).toFixed(4)) : 0,
  version: 'food-entity-intelligence-final-v3',
};

if (AUDIT) {
  result.unresolvedAudit = [...unresolved.values()]
    .map((x) => ({ ...x, reasons: [...x.reasons] }))
    .sort((a, b) => b.count - a.count || a.normalized.localeCompare(b.normalized))
    .slice(0, 500);
}

console.log(JSON.stringify(result, null, 2));
