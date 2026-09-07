import { randomUUID } from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CSV_URL = process.env.RECIPE_IMAGE_MAPPING_CSV_URL ?? 'https://huggingface.co/datasets/Hieu-Pham/kaggle_food_recipes/resolve/main/Food%20Ingredients%20and%20Recipe%20Dataset%20with%20Image%20Name%20Mapping.csv?download=true';
const PAGE_SIZE = 1000;
const WRITE_BATCH = 500;
const UA = 'MYPA-RecipeSourceMappingRepair/1.1';

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');

const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clean = (value = '') => String(value).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, ' ').trim();
const normalize = (value = '') => clean(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[“”‘’]/g, "'").replace(/^["']+|["']+$/g, '').replace(/[^a-z0-9]+/gi, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; }
        else quoted = false;
      } else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += char;
  }
  if (field.length || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  return rows;
}

async function fetchJson(path, options = {}, attempts = 6) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { ...headers, ...(options.headers ?? {}) } });
      const text = await response.text();
      if (response.ok) return text ? JSON.parse(text) : null;
      if (response.status === 429 || response.status >= 500) { await sleep(500 * 2 ** i); continue; }
      throw new Error(`${response.status} ${path}: ${text}`);
    } catch (error) {
      last = error;
      if (i < attempts - 1) await sleep(500 * 2 ** i);
    }
  }
  throw last;
}

async function fetchAll(path, select) {
  const out = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await fetchJson(`${path}?select=${select}&order=id.asc&limit=${PAGE_SIZE}&offset=${offset}`);
    out.push(...(page ?? []));
    if (!page || page.length < PAGE_SIZE) break;
  }
  return out;
}

async function updateRows(rows) {
  for (let offset = 0; offset < rows.length; offset += WRITE_BATCH) {
    const batch = rows.slice(offset, offset + WRITE_BATCH);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/recipe_source_raw`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(batch),
    });
    if (!response.ok) throw new Error(`source mapping upsert failed: ${response.status}: ${await response.text()}`);
  }
}

async function main() {
  const response = await fetch(CSV_URL, { headers: { 'User-Agent': UA, Accept: 'text/csv,*/*' } });
  if (!response.ok) throw new Error(`Mapping CSV fetch failed: ${response.status}`);
  const csv = await response.text();
  const rows = parseCsv(csv);
  if (!rows.length) throw new Error('Mapping CSV is empty.');

  const header = rows[0].map(normalize);
  const titleIndex = header.findIndex((value) => ['title', 'recipe title', 'name'].includes(value));
  const imageIndex = header.findIndex((value) => ['image name', 'imagename', 'image_name'].includes(value));
  if (titleIndex < 0 || imageIndex < 0) throw new Error(`Mapping CSV missing title/image columns: ${header.join(', ')}`);

  const csvByTitle = new Map();
  for (const row of rows.slice(1)) {
    const title = normalize(row[titleIndex]);
    const imageName = clean(row[imageIndex]);
    if (!title || !imageName || imageName === '#NAME?') continue;
    csvByTitle.set(title, imageName);
  }

  const recipes = await fetchAll('recipes', 'id,name');
  const sourceRows = await fetchAll('recipe_source_raw', 'id,recipe_id,image_name');
  const sourceByRecipe = new Map(sourceRows.map((row) => [row.recipe_id, row]));
  const repairs = [];
  for (const recipe of recipes) {
    const current = sourceByRecipe.get(recipe.id);
    const currentImage = clean(current?.image_name);
    if (currentImage && currentImage !== '#NAME?' && !currentImage.includes('[')) continue;
    const imageName = csvByTitle.get(normalize(recipe.name));
    if (!imageName) continue;
    repairs.push({ id: current?.id ?? randomUUID(), recipe_id: recipe.id, image_name: imageName });
  }

  await updateRows(repairs);
  const repairedIds = new Set(repairs.map((row) => row.recipe_id));
  const unresolved = sourceRows.filter((row) => {
    if (repairedIds.has(row.recipe_id)) return false;
    const value = clean(row.image_name);
    return !value || value === '#NAME?' || value.includes('[');
  }).length;

  console.log(JSON.stringify({ status: unresolved === 0 ? 'complete' : 'partial', csvRows: rows.length - 1, mappedTitles: csvByTitle.size, recipes: recipes.length, existingSourceRows: sourceRows.length, repaired: repairs.length, unresolvedKnownRows: unresolved }, null, 2));
  if (unresolved > 0) process.exitCode = 2;
}

main().catch((error) => { console.error(error); process.exitCode = 1; });