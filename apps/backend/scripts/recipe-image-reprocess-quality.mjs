import sharp from 'sharp';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'recipe-images';
const MAX_BYTES = 60 * 1024;
const CONCURRENCY = Math.min(Math.max(Number(process.env.RECIPE_IMAGE_CONCURRENCY || '2'), 1), 4);
const DATASET_DIR = process.env.RECIPE_IMAGE_DATASET_DIR ? resolve(process.env.RECIPE_IMAGE_DATASET_DIR) : null;
const LIMIT = Math.max(Number(process.env.RECIPE_IMAGE_REPROCESS_LIMIT || '0'), 0);

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
const authHeaders = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

async function rest(path, options = {}, attempts = 6) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { ...authHeaders, 'Content-Type': 'application/json', ...(options.headers || {}) } });
      const text = await r.text();
      if (r.ok) return text ? JSON.parse(text) : null;
      if (r.status === 429 || r.status >= 500) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** i));
        continue;
      }
      throw new Error(`${r.status} ${path}: ${text}`);
    } catch (e) {
      last = e;
      if (i < attempts - 1) await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** i));
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

async function existingRows() {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await rest(`recipe_images?select=id,recipe_id,image_type,storage_key,byte_size,width,height&image_type=eq.hero&order=recipe_id.asc&limit=1000&offset=${offset}`);
    rows.push(...(page || []));
    if (!page || page.length < 1000) break;
  }
  return LIMIT > 0 ? rows.slice(0, LIMIT) : rows;
}

async function sourceRows() {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await rest(`recipe_source_raw?select=recipe_id,image_name&order=created_at.asc&limit=1000&offset=${offset}`);
    rows.push(...(page || []));
    if (!page || page.length < 1000) break;
  }
  return new Map(rows.map((row) => [row.recipe_id, row.image_name]));
}

async function bestWebp(input) {
  const meta = await sharp(input).metadata();
  const sourceWidth = meta.width || 0;
  const maxWidth = Math.min(sourceWidth || 960, 1200);
  const widths = [...new Set([maxWidth, 1080, 1024, 960, 900, 840, 800, 720, 640, 576, 512, 448, 384])]
    .filter((w) => w > 0 && w <= maxWidth)
    .sort((a, b) => b - a);
  const qualities = [90, 88, 86, 84, 82, 80, 78, 76, 74, 72, 70, 68, 66, 64, 62, 60, 58, 56, 54, 52, 50, 48, 46, 44, 42, 40];

  let best = null;
  for (const width of widths) {
    for (const quality of qualities) {
      const out = await sharp(input)
        .rotate()
        .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
        .webp({ quality, effort: 6 })
        .toBuffer();
      if (out.byteLength <= MAX_BYTES) {
        const score = width * 1_000_000 + quality * 1_000 - out.byteLength / 1_000;
        if (!best || score > best.score) best = { out, width, quality, score };
        break;
      }
    }
  }

  if (!best) throw new Error(`Cannot produce WebP <= 60KB (source=${sourceWidth})`);
  const outMeta = await sharp(best.out).metadata();
  return { buffer: best.out, width: outMeta.width || best.width, height: outMeta.height || meta.height || best.width, quality: best.quality };
}

async function upload(key, buffer) {
  const encoded = key.split('/').map(encodeURIComponent).join('/');
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encoded}`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'image/webp', 'Cache-Control': '31536000', 'x-upsert': 'true' },
    body: buffer,
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Storage upload ${r.status}: ${text}`);
}

async function processOne(row, imageName, index) {
  const file = index.get(imageName) || index.get(`${imageName}.jpg`) || index.get(`${imageName}.jpeg`) || index.get(`${imageName}.png`) || index.get(`${imageName}.webp`);
  if (!file) throw new Error(`Original image not found: ${imageName}`);
  const original = await readFile(file);
  const c = await bestWebp(original);
  await upload(row.storage_key, c.buffer);
  await rest(`recipe_images?id=eq.${encodeURIComponent(row.id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ byte_size: c.buffer.byteLength, width: c.width, height: c.height, mime_type: 'image/webp' }),
  });
  return { bytes: c.buffer.byteLength, width: c.width, height: c.height, quality: c.quality };
}

async function main() {
  if (!DATASET_DIR || !existsSync(DATASET_DIR)) throw new Error('Set RECIPE_IMAGE_DATASET_DIR to the extracted dataset directory.');
  const index = imageIndex(DATASET_DIR);
  const src = await sourceRows();
  const rows = await existingRows();
  const stats = { processed: 0, failed: 0, beforeBytes: 0, afterBytes: 0, maxBytes: 0, minBytes: Number.MAX_SAFE_INTEGER };
  console.log(JSON.stringify({ datasetDir: DATASET_DIR, candidates: rows.length, concurrency: CONCURRENCY }, null, 2));

  let cursor = 0;
  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= rows.length) return;
      const row = rows[i];
      stats.beforeBytes += Number(row.byte_size || 0);
      try {
        const result = await processOne(row, src.get(row.recipe_id), index);
        stats.processed += 1;
        stats.afterBytes += result.bytes;
        stats.maxBytes = Math.max(stats.maxBytes, result.bytes);
        stats.minBytes = Math.min(stats.minBytes, result.bytes);
        if (stats.processed % 10 === 0) console.log(JSON.stringify({ progress: stats.processed, ...stats, last: result }, null, 2));
      } catch (e) {
        stats.failed += 1;
        console.error(`[FAILED] ${row.recipe_id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, rows.length) }, () => worker()));
  const avg = stats.processed ? stats.afterBytes / stats.processed : 0;
  console.log(JSON.stringify({ status: 'complete', ...stats, avgBytes: Math.round(avg) }, null, 2));
  if (stats.failed > 0) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
