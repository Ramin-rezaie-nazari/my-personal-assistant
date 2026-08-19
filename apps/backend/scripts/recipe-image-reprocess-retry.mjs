import sharp from 'sharp';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'recipe-images';
const MAX_BYTES = 60 * 1024;
const CONCURRENCY = Math.min(Math.max(Number(process.env.RECIPE_IMAGE_CONCURRENCY || '1'), 1), 2);
const DATASET_DIR = process.env.RECIPE_IMAGE_DATASET_DIR ? resolve(process.env.RECIPE_IMAGE_DATASET_DIR) : null;

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
if (!DATASET_DIR || !existsSync(DATASET_DIR)) throw new Error('Set RECIPE_IMAGE_DATASET_DIR to the extracted dataset directory.');

const authHeaders = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function rest(path, options = {}, attempts = 7) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { ...authHeaders, 'Content-Type': 'application/json', ...(options.headers || {}) } });
      const text = await r.text();
      if (r.ok) return text ? JSON.parse(text) : null;
      if (r.status === 429 || r.status >= 500) {
        await sleep(Math.min(15000, 1500 * 2 ** i));
        continue;
      }
      throw new Error(`${r.status} ${path}: ${text}`);
    } catch (e) {
      last = e;
      if (i < attempts - 1) await sleep(Math.min(15000, 1500 * 2 ** i));
    }
  }
  throw last;
}

function imageIndex(root) {
  const stack = [root];
  const index = new Map();
  while (stack.length) {
    const dir = stack.pop();
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) stack.push(full);
      else if (/\.(jpg|jpeg|png|webp)$/i.test(name)) {
        const stem = basename(name, extname(name));
        if (!index.has(name)) index.set(name, full);
        if (!index.has(stem)) index.set(stem, full);
      }
    }
  }
  return index;
}

async function getRows() {
  const images = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await rest(`recipe_images?select=id,recipe_id,storage_key,byte_size,width,height,mime_type&image_type=eq.hero&order=recipe_id.asc&limit=1000&offset=${offset}`);
    images.push(...(page || []));
    if (!page || page.length < 1000) break;
  }

  const sources = new Map();
  for (let offset = 0; ; offset += 1000) {
    const page = await rest(`recipe_source_raw?select=recipe_id,image_name&order=created_at.asc&limit=1000&offset=${offset}`);
    for (const row of page || []) sources.set(row.recipe_id, row.image_name);
    if (!page || page.length < 1000) break;
  }

  return images.map((row) => ({ ...row, image_name: sources.get(row.recipe_id) })).filter((row) => row.image_name);
}

async function bestWebp(input) {
  const meta = await sharp(input).metadata();
  const sourceWidth = meta.width || 0;
  const maxWidth = Math.min(sourceWidth || 960, 1200);
  const widths = [...new Set([maxWidth, 1080, 1024, 960, 900, 840, 800, 720, 640, 576, 512, 448, 384])]
    .filter((w) => w > 0 && w <= maxWidth)
    .sort((a, b) => b - a);
  const qualities = [90, 88, 86, 84, 82, 80, 78, 76, 74, 72, 70, 68, 66, 64, 62, 60, 58, 56, 54, 52, 50, 48, 46, 44, 42, 40];

  for (const width of widths) {
    for (const quality of qualities) {
      const out = await sharp(input).rotate().resize({ width, height: width, fit: 'inside', withoutEnlargement: true }).webp({ quality, effort: 6 }).toBuffer();
      if (out.byteLength <= MAX_BYTES) {
        const outMeta = await sharp(out).metadata();
        return { buffer: out, width: outMeta.width || width, height: outMeta.height || 0, quality };
      }
    }
  }
  throw new Error(`Cannot produce WebP <= 60KB from ${sourceWidth}px source`);
}

async function uploadWithRetry(key, buffer) {
  const encoded = key.split('/').map(encodeURIComponent).join('/');
  let last;
  for (let i = 0; i < 7; i += 1) {
    try {
      const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encoded}`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'image/webp', 'Cache-Control': '31536000', 'x-upsert': 'true' },
        body: buffer,
      });
      const text = await r.text();
      if (r.ok) return;
      if ([429, 500, 502, 503, 504].includes(r.status)) {
        await sleep(Math.min(20000, 1500 * 2 ** i));
        continue;
      }
      throw new Error(`Storage upload ${r.status}: ${text}`);
    } catch (e) {
      last = e;
      await sleep(Math.min(20000, 1500 * 2 ** i));
    }
  }
  throw last || new Error('Storage upload failed after retries');
}

async function updateRow(id, patch) {
  await rest(`recipe_images?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(patch),
  });
}

async function processOne(row, index) {
  const file = index.get(row.image_name) || index.get(`${row.image_name}.jpg`) || index.get(`${row.image_name}.jpeg`) || index.get(`${row.image_name}.png`) || index.get(`${row.image_name}.webp`);
  if (!file) throw new Error(`Original image not found: ${row.image_name}`);

  const original = await readFile(file);
  const c = await bestWebp(original);
  const unchanged = Number(row.byte_size) === c.buffer.byteLength && Number(row.width) === c.width && Number(row.height) === c.height && row.mime_type === 'image/webp';
  if (unchanged) return { action: 'already-optimal', bytes: c.buffer.byteLength, width: c.width, height: c.height, quality: c.quality };

  await uploadWithRetry(row.storage_key, c.buffer);
  await updateRow(row.id, { byte_size: c.buffer.byteLength, width: c.width, height: c.height, mime_type: 'image/webp' });
  return { action: 'repaired', bytes: c.buffer.byteLength, width: c.width, height: c.height, quality: c.quality };
}

async function main() {
  const index = imageIndex(DATASET_DIR);
  const rows = await getRows();
  const stats = { candidates: rows.length, checked: 0, repaired: 0, alreadyOptimal: 0, failed: 0 };
  console.log(JSON.stringify({ datasetDir: DATASET_DIR, candidates: rows.length, concurrency: CONCURRENCY }, null, 2));

  let cursor = 0;
  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= rows.length) return;
      const row = rows[i];
      try {
        const result = await processOne(row, index);
        stats.checked += 1;
        if (result.action === 'repaired') stats.repaired += 1;
        else stats.alreadyOptimal += 1;
        if (stats.checked % 25 === 0) console.log(JSON.stringify({ progress: stats.checked, ...stats, last: result }, null, 2));
      } catch (e) {
        stats.checked += 1;
        stats.failed += 1;
        console.error(`[FAILED] ${row.recipe_id} ${row.image_name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, rows.length) }, () => worker()));
  console.log(JSON.stringify({ status: 'complete', ...stats }, null, 2));
  if (stats.failed > 0) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
