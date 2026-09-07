import { randomUUID } from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CSV_URL = process.env.RECIPE_IMAGE_MAPPING_CSV_URL ?? 'https://huggingface.co/datasets/Hieu-Pham/kaggle_food_recipes/resolve/main/Food%20Ingredients%20and%20Recipe%20Dataset%20with%20Image%20Name%20Mapping.csv?download=true';
const PAGE_SIZE = 500;
const UA = 'MYPA-RecipeSourceMappingRepair/1.0';

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
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
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

async function updateRows(rows) {
  if (!rows.length) return;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/recipe_source_raw`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });
  if (!response.ok) throw new Error(`source mapping upsert failed: ${response.status} ${await response.text()}`);
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

  const byTitle = new Map();
  for (const row of rows.slice(1)) {
    const title = normalize(row[titleIndex]);
    const imageName = clean(row[imageIndex]);
    if (!title || !imageName || imageName === '#NAME?') continue;
    byTitle.set(title, imageName);
  }

  let repaired = 0;
  let unresolved = 0;
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const recipes = await fetchJson(`recipes?select=id,name&order=id.asc&limit=${PAGE_SIZE}&offset=${offset}`);
    if (!recipes?.length) break;
    const payload = [];
    for (const recipe of recipes) {
      const title = normalize(recipe.name);
      const imageName = byTitle.get(title);
      if (!imageName) continue;
      const source = await fetchJson(`recipe_source_raw?select=id,recipe_id,image_name&recipe_id=eq.${encodeURIComponent(recipe.id)}&limit=1`);
      const current = source?.[0];
      const currentImage = clean(current?.image_name);
      if (currentImage && currentImage !== '#NAME?' && !currentImage.includes('[')) continue;
      payload.push({
        id: current?.id ?? randomUUID(),
        recipe_id: recipe.id,
        image_name: imageName,
      });
    }
    if (payload.length) { await updateRows(payload); repaired += payload.length; }
    if (recipes.length < PAGE_SIZE) break;
  }

  const remaining = await fetchJson("recipe_source_raw?select=recipe_id&or=(image_name.is.null,image_name.eq.#NAME?,image_name.like.*[*]*)&limit=10000");
  unresolved = remaining?.length ?? 0;
  console.log(JSON.stringify({ status: unresolved === 0 ? 'complete' : 'partial', csvRows: rows.length - 1, mappedTitles: byTitle.size, repaired, unresolved }, null, 2));
  if (unresolved > 0) process.exitCode = 2;
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
