import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const ROOT = path.resolve(process.env.RECIPE_LOCAL_ROOT || './data/mypa-recipe-media-local');
const CATALOG = path.resolve(process.env.RECIPE_LOCAL_CATALOG || './data/mypa-recipe-media/recipe-catalog.jsonl');
const IMAGE_ROOT = path.join(ROOT, 'images', 'recipes');
const MANIFEST = path.join(ROOT, 'manifest', 'recipe-heroes-google-first.jsonl');
const FAILURE = path.join(ROOT, 'manifest', 'google-first-failures.jsonl');
const STATE = path.join(ROOT, 'manifest', 'google-first-state.json');
const MAX_BYTES = Math.max(Number(process.env.RECIPE_GOOGLE_LOCAL_MAX_BYTES || '150000'), 30000);
const MIN_BYTES = Math.max(Number(process.env.RECIPE_GOOGLE_LOCAL_MIN_BYTES || '12000'), 1000);
const MIN_SIDE = Math.max(Number(process.env.RECIPE_GOOGLE_LOCAL_MIN_SIDE || '480'), 240);
const CONCURRENCY = Math.min(Math.max(Number(process.env.RECIPE_GOOGLE_LOCAL_CONCURRENCY || '3'), 1), 6);
const DELAY_MS = Math.max(Number(process.env.RECIPE_GOOGLE_LOCAL_DELAY_MS || '1400'), 0);
const SEARCH_TIMEOUT_MS = Math.max(Number(process.env.RECIPE_GOOGLE_LOCAL_SEARCH_TIMEOUT_MS || '15000'), 5000);
const IMAGE_TIMEOUT_MS = Math.max(Number(process.env.RECIPE_GOOGLE_LOCAL_IMAGE_TIMEOUT_MS || '20000'), 5000);
const LIMIT = Math.max(Number(process.env.RECIPE_GOOGLE_LOCAL_LIMIT || '0'), 0);
const FORCE = process.env.RECIPE_GOOGLE_LOCAL_FORCE === '1';
const USER_AGENT = process.env.RECIPE_GOOGLE_LOCAL_USER_AGENT || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36';
const BAD_HOSTS = new Set(['facebook.com','instagram.com','pinterest.com','youtube.com','wikipedia.org','linkedin.com','duckspecies.org','pa.gov','eset.com','britishairways.com']);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const exists = (file) => { try { fsSync.accessSync(file); return true; } catch { return false; } };
const host = (url) => { try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; } };
const badHost = (url) => { const h = host(url); return !h || BAD_HOSTS.has(h) || [...BAD_HOSTS].some((x) => h.endsWith(`.${x}`)); };
const normalizeUrl = (value) => {
  if (!value) return null;
  let v = String(value).trim().replaceAll('\\u003d', '=').replaceAll('\\u0026', '&').replaceAll('\\/', '/');
  try { v = decodeURIComponent(v); } catch {}
  if (v.startsWith('//')) v = `https:${v}`;
  if (!/^https?:\/\//i.test(v)) return null;
  return v;
};

async function appendJsonl(file, row) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.appendFile(file, JSON.stringify(row) + '\n');
}

async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2));
}

async function loadCatalog() {
  if (!exists(CATALOG)) throw new Error(`Catalog not found: ${CATALOG}`);
  return (await fs.readFile(CATALOG, 'utf8'))
    .split(/\r?\n/).filter(Boolean).map(JSON.parse)
    .map((row) => ({ recipeId: String(row.recipeId || row.id || ''), name: String(row.name || row.recipeName || '') }))
    .filter((row) => row.recipeId && row.name);
}

function extractImageCandidates(html) {
  const candidates = [];
  const push = (raw) => {
    const url = normalizeUrl(raw);
    if (!url || badHost(url)) return;
    const lower = url.toLowerCase();
    if (/gstatic\.com\/images\/branding|googleusercontent\.com\/static|sprite|logo|icon|avatar|favicon|pixel|tracking|placeholder/i.test(lower)) return;
    candidates.push(url);
  };
  const regexes = [
    /"ou"\s*:\s*"((?:\\.|[^"\\])+)"/g,
    /\\"ou\\"\s*:\s*\\"((?:\\.|[^"\\])+)\\"/g,
    /[?&]imgurl=([^&"']+)/g,
    /data-iurl=["']([^"']+)["']/g,
    /data-original=["']([^"']+)["']/g,
  ];
  for (const regex of regexes) for (const match of html.matchAll(regex)) push(match[1]);
  return [...new Set(candidates)];
}

async function googleCandidates(recipeName) {
  const queries = [
    `${recipeName} recipe`,
    `"${recipeName}" recipe`,
    recipeName,
  ];
  let lastError = null;
  for (const query of queries) {
    const url = `https://www.google.com/search?tbm=isch&hl=en&gl=us&q=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
      });
      const html = await response.text();
      if (!response.ok) throw new Error(`Google Images ${response.status}`);
      const candidates = extractImageCandidates(html);
      if (candidates.length) return { query, searchUrl: url, candidates };
      lastError = new Error(/captcha|unusual traffic|not a robot|consent/i.test(html) ? 'Google challenge/blocked' : 'Google returned no image URLs');
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
    await sleep(Math.min(2500, Math.max(500, DELAY_MS)));
  }
  throw lastError || new Error('Google Images search failed');
}

async function downloadImage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.7',
      },
    });
    if (!response.ok) throw new Error(`image ${response.status}`);
    const body = Buffer.from(await response.arrayBuffer());
    if (body.length < MIN_BYTES) throw new Error(`image too small (${body.length} bytes)`);
    return body;
  } finally {
    clearTimeout(timer);
  }
}

async function prepareImage(body) {
  const input = sharp(body, { failOn: 'none' }).rotate();
  const meta = await input.metadata();
  const sw = Number(meta.width || 0), sh = Number(meta.height || 0);
  if (Math.min(sw, sh) < MIN_SIDE) throw new Error(`source too small (${sw}x${sh})`);

  let smallest = null;
  for (const width of [1200, 1080, 960, 880, 800, 720, 640, 576, 512, 480]) {
    for (const quality of [82, 74, 66, 58, 50, 42, 34, 26, 18]) {
      const out = await input.clone().resize({ width, fit: 'inside', withoutEnlargement: true }).webp({ quality, effort: 6 }).toBuffer();
      const outMeta = await sharp(out, { failOn: 'none' }).metadata();
      const item = { out, width: Number(outMeta.width || width), height: Number(outMeta.height || 0), bytes: out.byteLength, quality };
      if (!smallest || item.bytes < smallest.bytes) smallest = item;
      if (item.bytes >= MIN_BYTES && item.bytes <= MAX_BYTES && Math.min(item.width, item.height) >= MIN_SIDE) return item;
    }
  }
  if (smallest && smallest.bytes <= MAX_BYTES && Math.min(smallest.width, smallest.height) >= MIN_SIDE) return smallest;
  throw new Error(`cannot create acceptable WebP (smallest=${smallest?.bytes || 'n/a'})`);
}

async function hasLocalHero(recipeId) {
  const dir = path.join(IMAGE_ROOT, recipeId);
  for (const candidate of ['hero.webp', '01.webp']) if (exists(path.join(dir, candidate))) return true;
  return false;
}

async function saveHero(recipe, found, prepared) {
  const dir = path.join(IMAGE_ROOT, recipe.recipeId);
  await fs.mkdir(dir, { recursive: true });
  const heroPath = path.join(dir, 'hero.webp');
  await fs.writeFile(heroPath, prepared.out);
  const hash = crypto.createHash('sha256').update(prepared.out).digest('hex');
  const record = {
    recipeId: recipe.recipeId,
    recipeName: recipe.name,
    imageType: 'hero',
    file: path.relative(ROOT, heroPath),
    source: 'google-images-first-downloadable',
    sourceImageUrl: found.imageUrl,
    query: found.query,
    searchUrl: found.searchUrl,
    resultPosition: found.resultPosition,
    verified: false,
    confidence: 'unverified',
    width: prepared.width,
    height: prepared.height,
    bytes: prepared.bytes,
    sha256: hash,
    downloadedAt: new Date().toISOString(),
  };
  await appendJsonl(MANIFEST, record);
  return record;
}

async function processRecipe(recipe) {
  if (!FORCE && await hasLocalHero(recipe.recipeId)) return { status: 'skip-existing', recipe };
  const found = await googleCandidates(recipe.name);
  let last = null;
  for (let i = 0; i < found.candidates.length; i += 1) {
    const imageUrl = found.candidates[i];
    try {
      const body = await downloadImage(imageUrl);
      const prepared = await prepareImage(body);
      return { status: 'complete', record: await saveHero(recipe, { ...found, imageUrl, resultPosition: i + 1 }, prepared) };
    } catch (error) {
      last = error;
    }
  }
  throw last || new Error('No downloadable Google image candidate');
}

async function main() {
  const catalog = await loadCatalog();
  const state = await readJson(STATE, { complete: 0, failed: 0, skipped: 0, lastIndex: 0 });
  const startIndex = FORCE ? 0 : Number(state.lastIndex || 0);
  const work = catalog.slice(startIndex);
  const selected = LIMIT > 0 ? work.slice(0, LIMIT) : work;
  const stats = { totalCatalog: catalog.length, selected: selected.length, complete: 0, failed: 0, skipped: 0, existingAtStart: 0 };
  console.log(JSON.stringify({ engine: 'local-google-first-v1', localOnly: true, warning: 'Google-first images are not recipe-verified', concurrency: CONCURRENCY, delayMs: DELAY_MS, ...stats }, null, 2));

  let cursor = 0;
  async function worker() {
    while (true) {
      const localIndex = cursor++;
      if (localIndex >= selected.length) return;
      const recipe = selected[localIndex];
      const absoluteIndex = startIndex + localIndex;
      try {
        const result = await processRecipe(recipe);
        if (result.status === 'skip-existing') {
          stats.skipped += 1;
          stats.existingAtStart += 1;
          console.log(`[SKIP ${stats.skipped}] ${recipe.name}`);
        } else {
          stats.complete += 1;
          console.log(`[COMPLETE ${stats.complete}] ${recipe.name} -> hero [Google first downloadable, unverified]`);
        }
        await writeJson(STATE, { ...stats, lastIndex: absoluteIndex + 1, updatedAt: new Date().toISOString() });
      } catch (error) {
        stats.failed += 1;
        const reason = error instanceof Error ? error.message : String(error);
        await appendJsonl(FAILURE, { recipeId: recipe.recipeId, recipeName: recipe.name, status: 'pending-retry', reason, index: absoluteIndex, updatedAt: new Date().toISOString() });
        console.error(`[FAILED/PENDING] ${recipe.name}: ${reason}`);
        await writeJson(STATE, { ...stats, lastIndex: absoluteIndex + 1, updatedAt: new Date().toISOString() });
      }
      await sleep(DELAY_MS);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, selected.length) }, () => worker()));
  console.log(JSON.stringify({ status: stats.failed ? 'partial' : 'complete', ...stats }, null, 2));
  process.exitCode = stats.failed ? 2 : 0;
}

main().catch((error) => { console.error(error); process.exit(1); });
