import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const ROOT = path.resolve(process.env.RECIPE_SERPER_LOCAL_ROOT || './data/mypa-recipe-media-local');
const CATALOG = path.resolve(process.env.RECIPE_SERPER_LOCAL_CATALOG || './data/mypa-recipe-media/recipe-catalog.jsonl');
const IMAGE_ROOT = path.join(ROOT, 'images', 'recipes');
const MANIFEST = path.join(ROOT, 'manifest', 'recipe-heroes-serper.jsonl');
const FAILURE = path.join(ROOT, 'manifest', 'serper-image-failures.jsonl');
const TARGET_BYTES = 150000;
const MIN_SIDE = 240;
const LIMIT = Math.max(Number(process.env.RECIPE_SERPER_LOCAL_LIMIT || '0'), 0);
const CONCURRENCY = Math.min(Math.max(Number(process.env.RECIPE_SERPER_LOCAL_CONCURRENCY || '4'), 1), 10);
const DELAY_MS = Math.max(Number(process.env.RECIPE_SERPER_LOCAL_DELAY_MS || '250'), 0);
const MAX_ATTEMPTS = Math.max(Number(process.env.RECIPE_SERPER_LOCAL_MAX_ATTEMPTS || '3'), 1);
const API_TIMEOUT_MS = Math.max(Number(process.env.RECIPE_SERPER_LOCAL_API_TIMEOUT_MS || '20000'), 5000);
const IMAGE_TIMEOUT_MS = Math.max(Number(process.env.RECIPE_SERPER_LOCAL_IMAGE_TIMEOUT_MS || '20000'), 5000);
const API_KEY = process.env.SERPER_API_KEY || '';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exists = (p) => { try { fsSync.accessSync(p); return true; } catch { return false; } };
const append = async (file, row) => { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.appendFile(file, JSON.stringify(row) + '\n'); };

async function loadCatalog() {
  if (!exists(CATALOG)) throw new Error(`Catalog not found: ${CATALOG}`);
  return (await fs.readFile(CATALOG, 'utf8')).split(/\r?\n/).filter(Boolean).map(JSON.parse)
    .map((r) => ({ recipeId: String(r.recipeId || r.id || ''), name: String(r.name || r.recipeName || '') }))
    .filter((r) => r.recipeId && r.name);
}

async function hasHero(id) {
  const d = path.join(IMAGE_ROOT, id);
  return exists(path.join(d, 'hero.webp')) || exists(path.join(d, '01.webp'));
}

async function serperImages(query) {
  if (!API_KEY) throw new Error('SERPER_API_KEY is not set');
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), API_TIMEOUT_MS);
  try {
    const r = await fetch('https://google.serper.dev/images', {
      method: 'POST', signal: c.signal,
      headers: { 'X-API-KEY': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num: 10, gl: 'us', hl: 'en' }),
    });
    const text = await r.text();
    if (!r.ok) throw new Error(`Serper API ${r.status}: ${text.slice(0, 180)}`);
    const data = JSON.parse(text);
    const images = Array.isArray(data.images) ? data.images : [];
    if (!images.length) throw new Error('Serper returned no images');
    const first = images.find((x) => /^https?:\/\//i.test(x?.imageUrl || ''));
    if (!first) throw new Error('Serper returned no usable image URL');
    return { provider: 'serper-google-images', imageUrl: first.imageUrl, source: first.source || null, title: first.title || null, position: Number(first.position || 1), searchUrl: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}` };
  } finally { clearTimeout(t); }
}

async function downloadImage(url) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), IMAGE_TIMEOUT_MS);
  try {
    const r = await fetch(url, { redirect: 'follow', signal: c.signal, headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'image/avif,image/webp,image/apng,image/jpeg,image/png,*/*;q=0.8' } });
    if (!r.ok) throw new Error(`image ${r.status}`);
    const b = Buffer.from(await r.arrayBuffer());
    if (!b.length) throw new Error('empty image');
    return b;
  } finally { clearTimeout(t); }
}

async function prepareImage(body) {
  const input = sharp(body, { failOn: 'none' }).rotate();
  const meta = await input.metadata();
  if (!meta.width || !meta.height || Math.min(meta.width, meta.height) < MIN_SIDE) throw new Error(`source too small (${meta.width}x${meta.height})`);
  let best = null;
  for (const width of [1600, 1400, 1200, 1080, 960, 840, 720, 640, 560, 480, 400, 320, 240]) {
    for (const quality of [92, 86, 80, 74, 68, 62, 56, 50, 44, 38, 32, 26, 20]) {
      const out = await input.clone().resize({ width, fit: 'inside', withoutEnlargement: true }).webp({ quality, effort: 5 }).toBuffer();
      const m = await sharp(out).metadata();
      if (Math.min(Number(m.width || 0), Number(m.height || 0)) < MIN_SIDE) continue;
      if (out.byteLength <= TARGET_BYTES && (!best || out.byteLength > best.bytes)) best = { out, width: Number(m.width), height: Number(m.height), bytes: out.byteLength, quality };
    }
  }
  if (!best) throw new Error('unable to encode image below 150KB');
  return best;
}

async function save(recipe, found, prepared) {
  const dir = path.join(IMAGE_ROOT, recipe.recipeId); await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, 'hero.webp'); await fs.writeFile(file, prepared.out);
  await append(MANIFEST, { recipeId: recipe.recipeId, recipeName: recipe.name, imageType: 'hero', file: path.relative(ROOT, file), source: found.provider, sourceImageUrl: found.imageUrl, sourceSite: found.source, title: found.title, query: `${recipe.name} recipe`, searchUrl: found.searchUrl, resultPosition: found.position, verified: false, confidence: 'first-image-search-result-unverified', width: prepared.width, height: prepared.height, bytes: prepared.bytes, quality: prepared.quality, sha256: crypto.createHash('sha256').update(prepared.out).digest('hex'), downloadedAt: new Date().toISOString() });
}

async function processRecipe(recipe) {
  if (await hasHero(recipe.recipeId)) return 'skip';
  let last = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const found = await serperImages(`${recipe.name} recipe`);
      const body = await downloadImage(found.imageUrl);
      const prepared = await prepareImage(body);
      await save(recipe, found, prepared);
      return 'complete';
    } catch (e) {
      last = e;
      if (attempt < MAX_ATTEMPTS) await sleep(1000 * attempt + Math.floor(Math.random() * 1000));
    }
  }
  throw last || new Error('image acquisition failed');
}

async function main() {
  const catalog = await loadCatalog();
  const pending = [];
  for (const r of catalog) if (!(await hasHero(r.recipeId))) pending.push(r);
  const selected = LIMIT ? pending.slice(0, LIMIT) : pending;
  const stats = { totalCatalog: catalog.length, selected: selected.length, complete: 0, failed: 0, skipped: catalog.length - pending.length };
  console.log(JSON.stringify({ engine: 'local-serper-google-images-v1', localOnly: true, policy: 'Serper Google Images result #1; local hero only', targetBytes: TARGET_BYTES, concurrency: CONCURRENCY, delayMs: DELAY_MS, ...stats }, null, 2));
  let cursor = 0;
  async function worker() {
    while (true) {
      const i = cursor++; if (i >= selected.length) return;
      const recipe = selected[i];
      try {
        const status = await processRecipe(recipe);
        if (status === 'skip') stats.skipped++; else { stats.complete++; console.log(`[COMPLETE ${stats.complete}] ${recipe.name} -> 1 hero`); }
      } catch (e) {
        stats.failed++;
        const reason = e instanceof Error ? e.message : String(e);
        await append(FAILURE, { recipeId: recipe.recipeId, recipeName: recipe.name, status: 'pending-retry', reason, updatedAt: new Date().toISOString() });
        console.error(`[PENDING ${stats.failed}] ${recipe.name}: ${reason}`);
      }
      if (DELAY_MS) await sleep(DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, selected.length) }, worker));
  const missing = catalog.length - stats.skipped - stats.complete;
  console.log(JSON.stringify({ status: missing ? 'partial' : 'complete', ...stats, missingAfterRun: missing }, null, 2));
  process.exitCode = missing ? 2 : 0;
}
main().catch((e) => { console.error(e); process.exit(1); });
