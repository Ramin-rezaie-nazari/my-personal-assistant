import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const ROOT = path.resolve(process.env.RECIPE_LOCAL_ROOT || './data/mypa-recipe-media-local');
const IMAGE_ROOT = path.join(ROOT, 'images', 'recipes');
const MANIFEST_DIR = path.join(ROOT, 'manifest');
const MANIFEST_PATH = path.join(MANIFEST_DIR, 'recipe-heroes.jsonl');
const SUMMARY_PATH = path.join(MANIFEST_DIR, 'summary.json');
const FAILURE_PATH = path.join(MANIFEST_DIR, 'failures.jsonl');

const CATALOG = process.env.RECIPE_LOCAL_CATALOG?.trim()
  ? path.resolve(process.env.RECIPE_LOCAL_CATALOG)
  : path.resolve('./data/mypa-recipe-media/recipe-catalog.jsonl');

const START = Math.max(Number(process.env.RECIPE_LOCAL_START || '0'), 0);
const LIMIT = Math.max(Number(process.env.RECIPE_LOCAL_LIMIT || '0'), 0);
const CONCURRENCY = Math.min(Math.max(Number(process.env.RECIPE_LOCAL_CONCURRENCY || '3'), 1), 6);
const DELAY_MS = Math.max(Number(process.env.RECIPE_LOCAL_DELAY_MS || '700'), 0);
const FORCE = process.env.RECIPE_LOCAL_FORCE === '1';
const MAX_CANDIDATES_PER_PAGE = 32;
const MAX_SEARCH_RESULTS = 8;
const PAGE_TIMEOUT_MS = 20000;
const IMAGE_TIMEOUT_MS = 20000;
const MAX_OUTPUT_BYTES = 150 * 1024;
const MIN_OUTPUT_BYTES = 20 * 1024;
const MIN_SOURCE_SIDE = 640;
const MIN_OUTPUT_SIDE = 640;
const MAX_SOURCE_RATIO = 2.5;
const USER_AGENT = 'MYPA-recipe-media-local/1.0';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const now = () => new Date().toISOString();

function ensureFileExists(file) {
  try { fsSync.accessSync(file); return true; } catch { return false; }
}

async function ensureDirs() {
  await Promise.all([
    fs.mkdir(IMAGE_ROOT, { recursive: true }),
    fs.mkdir(MANIFEST_DIR, { recursive: true }),
  ]);
}

async function appendJsonl(file, row) {
  await fs.appendFile(file, `${JSON.stringify(row)}\n`);
}

async function loadCatalog() {
  if (!ensureFileExists(CATALOG)) {
    throw new Error(`Local recipe catalog not found: ${CATALOG}. Set RECIPE_LOCAL_CATALOG to a local JSONL catalog.`);
  }
  const text = await fs.readFile(CATALOG, 'utf8');
  const recipes = [];
  const seen = new Set();
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let row;
    try { row = JSON.parse(line); } catch { continue; }
    const id = String(row.recipeId || row.id || '').trim();
    const name = String(row.name || row.recipeName || '').trim();
    if (!id || !name || seen.has(id)) continue;
    seen.add(id);
    recipes.push({ id, name });
  }
  if (!recipes.length) throw new Error(`Local recipe catalog is empty: ${CATALOG}`);
  return recipes;
}

async function loadManifest() {
  try {
    const text = await fs.readFile(MANIFEST_PATH, 'utf8');
    const map = new Map();
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) continue;
      try {
        const row = JSON.parse(line);
        if (row.recipeId) map.set(String(row.recipeId), row);
      } catch {}
    }
    return map;
  } catch (error) {
    if (error.code === 'ENOENT') return new Map();
    throw error;
  }
}

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeUrl(value) {
  if (!value) return null;
  let url = String(value)
    .trim()
    .replaceAll('&amp;', '&')
    .replaceAll('\\/', '/')
    .replaceAll('\\u003d', '=')
    .replaceAll('\\u0026', '&');
  if (url.startsWith('//')) url = `https:${url}`;
  return /^https?:\/\//i.test(url) ? url : null;
}

function pageScore(url, recipe) {
  const u = String(url).toLowerCase();
  const slug = slugify(recipe.name);
  let score = 0;
  if (u.includes('epicurious.com/recipes/food/views/')) score += 100;
  if (u.includes(slug)) score += 80;
  if (u.includes('/recipes/food/views/')) score += 50;
  return score;
}

function discoverEpicuriousUrls(recipe, html) {
  const urls = [];
  const add = (value) => {
    const url = normalizeUrl(value)?.replace(/[),.;]+$/, '');
    if (url && /epicurious\.com\/recipes\/food\/views\//i.test(url)) urls.push(url);
  };
  for (const m of html.matchAll(/https?:\/\/www\.epicurious\.com\/recipes\/food\/views\/[A-Za-z0-9_%\-]+/gi)) add(m[0]);
  for (const m of html.matchAll(/https?:\/\/www\.epicurious\.com\/recipes\/food\/views\/[A-Za-z0-9_%\-]+/gi)) add(m[0]);
  return [...new Set(urls)].sort((a, b) => pageScore(b, recipe) - pageScore(a, recipe)).slice(0, MAX_SEARCH_RESULTS);
}

function epicuriousPageCandidates(recipe) {
  const raw = String(recipe.name || '').trim();
  const values = [...new Set([slugify(raw), raw.toLowerCase().replace(/\s+/g, '-'), raw].filter(Boolean))];
  return values.map((value) => `https://www.epicurious.com/recipes/food/views/${encodeURIComponent(value)}`);
}

function extractImageCandidates(html) {
  const found = [];
  const add = (value, score = 50) => {
    const url = normalizeUrl(value ? decodeURIComponentSafe(String(value)) : null);
    if (!url) return;
    const lower = url.toLowerCase();
    if (!lower.includes('assets.epicurious.com') && !/\.(?:jpe?g|png|webp)(?:[?#]|$)/i.test(url)) return;
    if (/encrypted-tbn|gstatic\.com\/images\/branding|googleusercontent\.com\/static/i.test(lower)) return;
    let rank = score;
    if (lower.includes('assets.epicurious.com')) rank -= 30;
    if (lower.includes('/master/')) rank -= 15;
    const width = lower.match(/(?:w_|width=|[?&]w=)(\d{3,4})/);
    if (width) rank -= Math.min(Number(width[1]) / 400, 15);
    found.push({ url, rank });
  };

  for (const m of html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]+content=["']([^"']+)["'][^>]*>/gi)) add(m[1], -50);
  for (const m of html.matchAll(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]*>/gi)) add(m[1], -50);
  for (const m of html.matchAll(/srcset=["']([^"']+)["']/gi)) {
    for (const item of m[1].split(',')) add(item.trim().split(/\s+/)[0], 5);
  }
  for (const m of html.matchAll(/(?:src|data-src|data-original)=["']([^"']+)["']/gi)) add(m[1], 10);
  for (const m of html.matchAll(/https?:\\?\/\\?\/assets\.epicurious\.com\/[^"'<>\\s]+/gi)) add(m[0], 0);

  const seen = new Set();
  return found
    .sort((a, b) => a.rank - b.rank)
    .filter((item) => {
      const key = item.url.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_CANDIDATES_PER_PAGE);
}

function decodeURIComponentSafe(value) {
  try { return decodeURIComponent(value); } catch { return value; }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = PAGE_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPage(url) {
  const response = await fetchWithTimeout(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  }, PAGE_TIMEOUT_MS);
  const html = await response.text();
  if (!response.ok || html.length < 1000) throw new Error(`Page ${response.status}: ${url}`);
  return { html, finalUrl: response.url || url };
}

async function fetchImage(url) {
  const response = await fetchWithTimeout(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    },
  }, IMAGE_TIMEOUT_MS);
  if (!response.ok) throw new Error(`Image ${response.status}: ${url}`);
  const body = Buffer.from(await response.arrayBuffer());
  if (body.length < 5000) throw new Error(`Image body too small: ${body.length} bytes`);
  return body;
}

async function validateSource(body) {
  const metadata = await sharp(body, { failOn: 'none' }).rotate().metadata();
  const width = Number(metadata.width || 0);
  const height = Number(metadata.height || 0);
  if (Math.min(width, height) < MIN_SOURCE_SIDE) throw new Error(`Source resolution too small: ${width}x${height}`);
  const ratio = width / height;
  if (ratio < 1 / MAX_SOURCE_RATIO || ratio > MAX_SOURCE_RATIO) throw new Error(`Source aspect ratio rejected: ${ratio.toFixed(2)}`);
  return { width, height, format: metadata.format || 'unknown' };
}

async function resolveImage(recipe) {
  let lastError = null;
  const directCandidates = epicuriousPageCandidates(recipe);
  for (const pageUrl of directCandidates) {
    try {
      const page = await fetchPage(pageUrl);
      const candidates = extractImageCandidates(page.html);
      for (const candidate of candidates) {
        try {
          const body = await fetchImage(candidate.url);
          const source = await validateSource(body);
          return { body, pageUrl: page.finalUrl, imageUrl: candidate.url, sourceWidth: source.width, sourceHeight: source.height };
        } catch (error) { lastError = error; }
      }
    } catch (error) { lastError = error; }
  }

  const queries = [
    `https://www.google.com/search?hl=en&gl=us&q=${encodeURIComponent(`site:epicurious.com/recipes/food/views ${recipe.name}`)}`,
    `https://www.bing.com/search?q=${encodeURIComponent(`site:epicurious.com/recipes/food/views ${recipe.name}`)}`,
  ];
  for (const searchUrl of queries) {
    try {
      const response = await fetchWithTimeout(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/140 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      }, PAGE_TIMEOUT_MS);
      const html = await response.text();
      if (!response.ok) continue;
      const pages = discoverEpicuriousUrls(recipe, html);
      for (const pageUrl of pages) {
        try {
          const page = await fetchPage(pageUrl);
          const candidates = extractImageCandidates(page.html);
          for (const candidate of candidates) {
            try {
              const body = await fetchImage(candidate.url);
              const source = await validateSource(body);
              return { body, pageUrl: page.finalUrl, imageUrl: candidate.url, sourceWidth: source.width, sourceHeight: source.height };
            } catch (error) { lastError = error; }
          }
        } catch (error) { lastError = error; }
      }
      if (pages.length) break;
    } catch (error) { lastError = error; }
  }

  throw lastError || new Error(`No usable Epicurious image found for ${recipe.name}`);
}

async function encodeWebp(input) {
  let best = null;
  const widths = [1200, 1080, 960, 880, 800, 720, 640];
  const qualities = [92, 88, 85, 82, 79, 76, 73, 70, 67, 64, 60, 56];

  for (const width of widths) {
    for (const quality of qualities) {
      const output = await sharp(input, { failOn: 'none' })
        .rotate()
        .resize({ width, fit: 'inside', withoutEnlargement: true })
        .webp({ quality, effort: 6 })
        .toBuffer();
      const metadata = await sharp(output, { failOn: 'none' }).metadata();
      const result = {
        output,
        width: Number(metadata.width || width),
        height: Number(metadata.height || width),
        bytes: output.length,
        quality,
      };
      if (result.width < MIN_OUTPUT_SIDE || result.height < MIN_OUTPUT_SIDE / MAX_SOURCE_RATIO) continue;
      if (!best || Math.abs(result.bytes - MAX_OUTPUT_BYTES * 0.75) < Math.abs(best.bytes - MAX_OUTPUT_BYTES * 0.75)) best = result;
      if (result.bytes >= MIN_OUTPUT_BYTES && result.bytes <= MAX_OUTPUT_BYTES) return result;
    }
  }

  if (best && best.bytes <= MAX_OUTPUT_BYTES && best.bytes >= MIN_OUTPUT_BYTES) return best;
  throw new Error(`Could not encode a usable WebP <=150KB; best=${best?.bytes ?? 'none'} bytes`);
}

async function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function loadExistingHero(recipe) {
  const file = path.join(IMAGE_ROOT, recipe.id, 'hero.webp');
  try {
    const body = await fs.readFile(file);
    const metadata = await sharp(body, { failOn: 'none' }).metadata();
    if (metadata.format === 'webp' && Number(metadata.width || 0) >= MIN_OUTPUT_SIDE && Number(metadata.height || 0) >= 480 && body.length >= MIN_OUTPUT_BYTES && body.length <= MAX_OUTPUT_BYTES) {
      return { file, bytes: body.length, width: metadata.width, height: metadata.height };
    }
  } catch {}
  return null;
}

async function main() {
  await ensureDirs();
  const recipes = await loadCatalog();
  const manifest = await loadManifest();
  const eligible = recipes.filter((recipe) => FORCE || !manifest.get(recipe.id)?.status || manifest.get(recipe.id).status !== 'complete');
  const work = eligible.slice(START, LIMIT > 0 ? START + LIMIT : undefined);
  const stats = {
    startedAt: now(),
    catalog: CATALOG,
    totalRecipes: recipes.length,
    eligibleRecipes: eligible.length,
    selected: work.length,
    completed: 0,
    failed: 0,
    skipped: 0,
    concurrency: CONCURRENCY,
    delayMs: DELAY_MS,
    maxBytes: MAX_OUTPUT_BYTES,
    minBytesSanity: MIN_OUTPUT_BYTES,
    minSourceSide: MIN_SOURCE_SIDE,
  };
  console.log(JSON.stringify(stats, null, 2));

  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= work.length) return;
      const recipe = work[index];
      try {
        const existing = await loadExistingHero(recipe);
        if (existing && !FORCE) {
          stats.skipped += 1;
          console.log(`[SKIPPED] ${recipe.id} ${recipe.name} existing=${existing.width}x${existing.height} ${existing.bytes}B`);
          continue;
        }

        const source = await resolveImage(recipe);
        const packed = await encodeWebp(source.body);
        const target = path.join(IMAGE_ROOT, recipe.id, 'hero.webp');
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, packed.output);

        const row = {
          recipeId: recipe.id,
          recipeName: recipe.name,
          status: 'complete',
          sourceType: 'epicurious-page',
          sourcePageUrl: source.pageUrl,
          sourceImageUrl: source.imageUrl,
          sourceWidth: source.sourceWidth,
          sourceHeight: source.sourceHeight,
          width: packed.width,
          height: packed.height,
          bytes: packed.bytes,
          quality: packed.quality,
          localPath: path.relative(ROOT, target),
          sha256: await sha256(packed.output),
          generatedAt: now(),
        };
        await appendJsonl(MANIFEST_PATH, row);
        manifest.set(recipe.id, row);
        stats.completed += 1;
        console.log(`[COMPLETE] ${recipe.id} ${recipe.name} ${source.sourceWidth}x${source.sourceHeight} -> ${packed.width}x${packed.height} ${packed.bytes}B q${packed.quality}`);
      } catch (error) {
        const row = {
          recipeId: recipe.id,
          recipeName: recipe.name,
          status: 'failed',
          reason: error instanceof Error ? error.message : String(error),
          failedAt: now(),
        };
        await appendJsonl(FAILURE_PATH, row);
        await appendJsonl(MANIFEST_PATH, row);
        manifest.set(recipe.id, row);
        stats.failed += 1;
        console.error(`[FAILED] ${recipe.id} ${recipe.name}: ${row.reason}`);
      }
      if (DELAY_MS) await sleep(DELAY_MS);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, work.length) }, () => worker()));
  stats.finishedAt = now();
  stats.status = stats.failed === 0 ? 'complete' : 'incomplete';
  await fs.writeFile(SUMMARY_PATH, JSON.stringify(stats, null, 2));
  console.log(JSON.stringify(stats, null, 2));
  if (stats.failed > 0) process.exitCode = 1;
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : String(error));
  await ensureDirs().catch(() => {});
  await appendJsonl(FAILURE_PATH, { status: 'fatal', reason: error instanceof Error ? error.message : String(error), failedAt: now() }).catch(() => {});
  process.exit(1);
});
