import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'recipe-images';
const MAX_BYTES = 60 * 1024;
const CONCURRENCY = Math.min(Math.max(Number(process.env.RECIPE_IMAGE_CONCURRENCY || '3'), 1), 4);
const DATASET_DIR = process.env.RECIPE_IMAGE_DATASET_DIR ? resolve(process.env.RECIPE_IMAGE_DATASET_DIR) : null;
const RESET = process.env.RECIPE_IMAGE_RESET === '1';
const DATASET_SLUG = 'pes12017000148/food-ingredients-and-recipe-dataset-with-images';
const DATASET_URL = 'https://www.kaggle.com/datasets/pes12017000148/food-ingredients-and-recipe-dataset-with-images';
const DATASET_SOURCE = 'Food Ingredients and Recipes Dataset with Images';
const DATASET_LICENSE = 'CC BY-SA 3.0';

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
const authHeaders = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function rest(path, options = {}, attempts = 6) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { ...authHeaders, 'Content-Type': 'application/json', ...(options.headers || {}) } });
      const text = await r.text();
      if (r.ok) return text ? JSON.parse(text) : null;
      if (r.status === 429 || r.status >= 500) { await sleep(1000 * 2 ** i); continue; }
      throw new Error(`${r.status} ${path}: ${text}`);
    } catch (e) { last = e; if (i < attempts - 1) await sleep(1000 * 2 ** i); }
  }
  throw last;
}

async function ensureBucket() {
  const r = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, { method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, file_size_limit: MAX_BYTES, allowed_mime_types: ['image/webp'] }) });
  if (r.ok) return;
  const text = await r.text(); let p = null; try { p = JSON.parse(text); } catch {}
  if (r.status === 409 || p?.code === 'BucketAlreadyExists' || p?.statusCode === '409') return;
  throw new Error(`Bucket error ${r.status}: ${text}`);
}

async function deleteStorage(key) {
  const encoded = key.split('/').map(encodeURIComponent).join('/');
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encoded}`, { method: 'DELETE', headers: authHeaders });
  if (!r.ok && r.status !== 404) throw new Error(`Storage delete failed: ${r.status} ${await r.text()}`);
}

async function resetState() {
  const files = [];
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, { method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefix: 'recipes', limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } }) });
  const text = await r.text();
  if (!r.ok) throw new Error(`Storage list failed: ${r.status} ${text}`);
  for (const item of JSON.parse(text)) if (item?.name) files.push(`recipes/${item.name}`);
  for (const key of files) await deleteStorage(key);
  await rest('recipe_images?image_type=eq.hero', { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  await rest('recipe_image_import_attempts?recipe_id=not.is.null', { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  console.log(JSON.stringify({ reset: true, deletedStorageObjects: files.length }, null, 2));
}

function datasetRoot() {
  if (DATASET_DIR && existsSync(DATASET_DIR)) return DATASET_DIR;
  for (const p of [join(process.cwd(), 'recipe-image-dataset'), join(process.cwd(), 'archive'), join(process.cwd(), 'Food Images')]) if (existsSync(p)) return p;
  try {
    const has = execFileSync('python3', ['-c', "import importlib.util; print(bool(importlib.util.find_spec('kagglehub')))"] , { encoding: 'utf8' }).trim() === 'True';
    if (!has) execFileSync('python3', ['-m', 'pip', 'install', '--user', 'kagglehub'], { stdio: 'inherit' });
    const out = execFileSync('python3', ['-c', `import kagglehub; print(kagglehub.dataset_download('${DATASET_SLUG}'))`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
    const p = out.split('\n').pop(); if (p && existsSync(p)) return p;
  } catch (e) { throw new Error(`Kaggle dataset download failed. Set RECIPE_IMAGE_DATASET_DIR manually. ${e instanceof Error ? e.message : String(e)}`); }
  throw new Error(`Dataset not found. Set RECIPE_IMAGE_DATASET_DIR. Source: ${DATASET_URL}`);
}

function imageIndex(root) {
  const stack = [root]; const index = new Map(); let count = 0;
  const exts = new Set(['.jpg', '.jpeg', '.png', '.webp']);
  while (stack.length) {
    const dir = stack.pop();
    for (const name of readdirSync(dir)) {
      const full = join(dir, name); const s = statSync(full);
      if (s.isDirectory()) stack.push(full);
      else if (exts.has(extname(name).toLowerCase())) {
        count += 1;
        const stem = name.slice(0, -extname(name).length);
        if (!index.has(name)) index.set(name, full);
        if (!index.has(stem)) index.set(stem, full);
      }
    }
  }
  return { index, count };
}

async function sourceRows() {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await rest(`recipe_source_raw?select=recipe_id,image_name&order=created_at.asc&limit=1000&offset=${offset}`);
    rows.push(...(page || []));
    if (!page || page.length < 1000) break;
  }
  return rows;
}

async function existingIds() {
  const ids = new Set();
  for (let offset = 0; ; offset += 1000) {
    const page = await rest(`recipe_images?select=recipe_id&image_type=eq.hero&limit=1000&offset=${offset}`);
    for (const row of page || []) ids.add(row.recipe_id);
    if (!page || page.length < 1000) break;
  }
  return ids;
}

async function mark(recipeId, status, reason) {
  await rest('recipe_image_import_attempts', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ recipe_id: recipeId, status, reason, attempt_count: 1, updated_at: new Date().toISOString() }) });
}

async function compress(input) {
  for (const width of [960, 880, 800, 720, 640, 576, 512, 448, 384, 320]) {
    for (const quality of [76, 70, 64, 58, 52, 46, 40, 34, 28]) {
      const out = await sharp(input).rotate().resize({ width, height: width, fit: 'inside', withoutEnlargement: true }).webp({ quality, effort: 6 }).toBuffer();
      if (out.byteLength <= MAX_BYTES) { const meta = await sharp(out).metadata(); return { out, width: meta.width ?? width, height: meta.height ?? width }; }
    }
  }
  throw new Error('No WebP variant <= 60KB');
}

async function importOne(row, file) {
  const input = await readFile(file);
  const c = await compress(input);
  const key = `recipes/${row.recipe_id}/hero.webp`;
  const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`;
  const upload = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`, { method: 'POST', headers: { ...authHeaders, 'Content-Type': 'image/webp', 'Cache-Control': '31536000', 'x-upsert': 'true' }, body: c.out });
  const uploadText = await upload.text();
  if (!upload.ok) throw new Error(`Storage upload ${upload.status}: ${uploadText}`);
  try {
    await rest('recipe_images', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ recipe_id: row.recipe_id, image_type: 'hero', step_number: null, image_url: url, width: c.width, height: c.height, byte_size: c.out.byteLength, mime_type: 'image/webp', alt_text: row.image_name, sort_order: 0, storage_key: key, source_name: DATASET_SOURCE, source_url: DATASET_URL, source_license: DATASET_LICENSE, source_attribution: `${DATASET_SOURCE}; ${DATASET_LICENSE}; exact Image_Name mapping. Transformed only by resize/recompression to WebP <= 60KB.` }) });
  } catch (e) { await deleteStorage(key); throw e; }
  return c.out.byteLength;
}

async function main() {
  await ensureBucket();
  if (RESET) await resetState();
  const root = datasetRoot();
  const { index, count } = imageIndex(root);
  const rows = await sourceRows();
  const done = await existingIds();
  const work = rows.filter((row) => row.image_name && !done.has(row.recipe_id));
  const stats = { imported: 0, skipped: 0, failed: 0, alreadyDone: rows.length - work.length, total: work.length };
  console.log(JSON.stringify({ datasetRoot: root, discoveredImages: count, sourceRows: rows.length, todo: work.length, concurrency: CONCURRENCY }, null, 2));
  let cursor = 0;
  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= work.length) return;
      const row = work[i];
      const file = index.get(row.image_name) || index.get(`${row.image_name}.jpg`) || index.get(`${row.image_name}.jpeg`) || index.get(`${row.image_name}.png`);
      if (!file) { stats.skipped += 1; await mark(row.recipe_id, 'skipped', `Dataset image not found for Image_Name=${row.image_name}`); continue; }
      try { const bytes = await importOne(row, file); stats.imported += 1; if ((stats.imported + stats.skipped + stats.failed) % 25 === 0) console.log(JSON.stringify({ progress: stats.imported + stats.skipped + stats.failed, ...stats, lastBytes: bytes }, null, 2)); }
      catch (e) { stats.failed += 1; const reason = e instanceof Error ? e.message : String(e); await mark(row.recipe_id, 'failed', reason); console.error(`[FAILED] ${row.recipe_id} ${row.image_name}: ${reason}`); }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, work.length) }, () => worker()));
  console.log(JSON.stringify({ status: 'complete', ...stats }, null, 2));
  if (stats.failed > 0) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
