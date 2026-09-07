import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const DEFAULT_CATALOGS = [
  process.env.RECIPE_LOCAL_CATALOG,
  path.resolve('./data/mypa-recipe-media/recipe-catalog.jsonl'),
  path.resolve('./data/mypa-recipe-media-quality/recipe-catalog.jsonl'),
].filter(Boolean);
const ROOT = path.resolve(process.env.RECIPE_LOCAL_ROOT || './data/mypa-recipe-media-local');
const IMAGE_ROOT = path.join(ROOT, 'images', 'recipes');
const MANIFEST = path.join(ROOT, 'manifest', 'recipe-heroes.jsonl');
const FAILURES = path.join(ROOT, 'audit', 'failures.jsonl');
const SUMMARY = path.join(ROOT, 'audit', 'summary.json');
const PAGE_SIZE = 500;
const CONCURRENCY = Math.min(Math.max(Number(process.env.RECIPE_LOCAL_CONCURRENCY || '3'), 1), 6);
const DELAY_MS = Math.max(Number(process.env.RECIPE_LOCAL_DELAY_MS || '700'), 100);
const LIMIT = Math.max(Number(process.env.RECIPE_LOCAL_LIMIT || '0'), 0);
const START = Math.max(Number(process.env.RECIPE_LOCAL_START || '0'), 0);
const FORCE = process.env.RECIPE_LOCAL_FORCE === '1';
const MIN_SOURCE_SIDE = 640;
const MIN_OUTPUT_SIDE = 640;
const MAX_OUTPUT_BYTES = 150 * 1024;
const ABSOLUTE_MAX_BYTES = 180 * 1024;
const MIN_ACCEPTABLE_BYTES = 30 * 1024;
const MAX_SOURCE_RATIO = 2.5;
const IMAGE_TIMEOUT_MS = 25000;
const PAGE_TIMEOUT_MS = 25000;
const USER_AGENT = 'MYPA-local-recipe-media/1.0';

function now() { return new Date().toISOString(); }
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function slugify(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function hash(buffer) { return crypto.createHash('sha256').update(buffer).digest('hex'); }

async function ensureDirs() {
  await Promise.all([
    fs.mkdir(IMAGE_ROOT, { recursive: true }),
    fs.mkdir(path.dirname(MANIFEST), { recursive: true }),
    fs.mkdir(path.dirname(FAILURES), { recursive: true }),
  ]);
}

async function append(file, row) { await fs.appendFile(file, `${JSON.stringify(row)}\n`); }

async function loadCatalog() {
  for (const candidate of DEFAULT_CATALOGS) {
    try {
      const text = await fs.readFile(candidate, 'utf8');
      const rows = [];
      for (const line of text.split('\n')) {
        if (!line.trim()) continue;
        const row = JSON.parse(line);
        if (row?.recipeId && String(row.name || '').trim()) rows.push({ recipeId: String(row.recipeId), name: String(row.name).trim() });
      }
      if (rows.length) return { path: candidate, rows };
    } catch {}
  }
  throw new Error('No local recipe catalog found. Expected data/mypa-recipe-media/recipe-catalog.jsonl or RECIPE_LOCAL_CATALOG. This job refuses to invent the recipe corpus.');
}

async function loadManifest() {
  try {
    const text = await fs.readFile(MANIFEST, 'utf8');
    const map = new Map();
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      const row = JSON.parse(line);
      if (row.recipeId) map.set(String(row.recipeId), row);
    }
    return map;
  } catch (error) {
    if (error.code === 'ENOENT') return new Map();
    throw error;
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = IMAGE_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}

function normalizeUrl(value) {
  if (!value) return null;
  let u = String(value).trim().replaceAll('&amp;', '&').replaceAll('\\/', '/').replaceAll('\\u003d', '=').replaceAll('\\u0026', '&');
  if (u.startsWith('//')) u = `https:${u}`;
  return /^https?:\/\//i.test(u) ? u : null;
}

function extractEpicuriousImages(html) {
  const found = [];
  const add = (value, rank) => {
    const u = normalizeUrl(value ? decodeSafe(String(value)) : null);
    if (!u) return;
    const l = u.toLowerCase();
    if (!l.includes('assets.epicurious.com') && !/\.(jpe?g|png|webp)(?:[?#]|$)/i.test(u)) return;
    let score = rank;
    if (l.includes('assets.epicurious.com')) score -= 20;
    if (l.includes('/master/')) score -= 12;
    const w = l.match(/(?:w_|width=|[?&]w=)(\d{3,4})/);
    if (w) score -= Math.min(Number(w[1]) / 400, 8);
    found.push({ url: u, score });
  };
  for (const m of html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]+content=["']([^"']+)["'][^>]*>/gi)) add(m[1], -30);
  for (const m of html.matchAll(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]*>/gi)) add(m[1], -30);
  for (const m of html.matchAll(/srcset=["']([^"']+)["']/gi)) for (const item of m[1].split(',')) add(item.trim().split(/\s+/)[0], 0);
  for (const m of html.matchAll(/(?:src|data-src|data-original)=["']([^"']+)["']/gi)) add(m[1], 4);
  for (const m of html.matchAll(/https?:\\?\/\\?\/assets\.epicurious\.com\/[^"'<>\\s]+/gi)) add(m[0], 1);
  const seen = new Set();
  return found.sort((a, b) => a.score - b.score).filter((x) => { const k = x.url.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
}
function decodeSafe(value) { try { return decodeURIComponent(value); } catch { return value; } }

async function searchRecipePage(recipe) {
  const query = `site:epicurious.com/recipes/food/views ${recipe.name}`;
  for (const engine of [
    `https://www.google.com/search?hl=en&gl=us&q=${encodeURIComponent(query)}`,
    `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
  ]) {
    try {
      const response = await fetchWithTimeout(engine, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/140 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      }, PAGE_TIMEOUT_MS);
      const html = await response.text();
      if (!response.ok) continue;
      const urls = [];
      for (const m of html.matchAll(/https?:\/\/www\.epicurious\.com\/recipes\/food\/views\/[A-Za-z0-9_%\-]+/gi)) urls.push(m[0].replace(/[.,)]+$/, ''));
      const unique = [...new Set(urls)];
      if (unique.length) return unique[0];
    } catch {}
  }
  return null;
}

function candidatePages(recipe) {
  const slug = slugify(recipe.name);
  return [
    `https://www.epicurious.com/recipes/food/views/${encodeURIComponent(slug)}`,
    `https://www.epicurious.com/recipes/food/views/${encodeURIComponent(recipe.name)}`,
  ];
}

async function resolveImage(recipe) {
  let last = null;
  const directPages = [...candidatePages(recipe)];
  const discovered = await searchRecipePage(recipe);
  if (discovered) directPages.push(discovered);
  for (const pageUrl of [...new Set(directPages)]) {
    try {
      const page = await fetchWithTimeout(pageUrl, {
        redirect: 'follow',
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.9' },
      }, PAGE_TIMEOUT_MS);
      const html = await page.text();
      if (!page.ok || html.length < 1000) throw new Error(`Epicurious page ${page.status}`);
      for (const candidate of extractEpicuriousImages(html).slice(0, 24)) {
        try {
          const image = await fetchWithTimeout(candidate.url, {
            redirect: 'follow',
            headers: { 'User-Agent': USER_AGENT, Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8' },
          }, IMAGE_TIMEOUT_MS);
          if (!image.ok) throw new Error(`Image ${image.status}`);
          const body = Buffer.from(await image.arrayBuffer());
          if (body.length < 5000) throw new Error(`Image bytes too small: ${body.length}`);
          const meta = await sharp(body, { failOn: 'none' }).rotate().metadata();
          const width = Number(meta.width || 0), height = Number(meta.height || 0);
          if (Math.min(width, height) < MIN_SOURCE_SIDE) throw new Error(`Source resolution too small: ${width}x${height}`);
          const ratio = width / height;
          if (ratio < 1 / MAX_SOURCE_RATIO || ratio > MAX_SOURCE_RATIO) throw new Error(`Source aspect ratio rejected: ${ratio.toFixed(2)}`);
          return { body, pageUrl: page.url || pageUrl, imageUrl: candidate.url, sourceWidth: width, sourceHeight: height };
        } catch (error) { last = error; }
      }
    } catch (error) { last = error; }
  }
  throw last || new Error(`No usable Epicurious image for ${recipe.name}`);
}

async function encodeBest(input) {
  let best = null;
  for (const width of [1200, 1080, 960, 880, 800, 720, 640]) {
    for (const quality of [92, 89, 86, 83, 80, 77, 74, 71, 68]) {
      const output = await sharp(input, { failOn: 'none' }).rotate().resize({ width, fit: 'inside', withoutEnlargement: true }).webp({ quality, effort: 6 }).toBuffer();
      const meta = await sharp(output, { failOn: 'none' }).metadata();
      const result = { output, width: Number(meta.width || width), height: Number(meta.height || width), bytes: output.length, quality };
      if (!best || result.bytes > best.bytes) best = result;
      if (result.bytes <= MAX_OUTPUT_BYTES && result.bytes >= MIN_ACCEPTABLE_BYTES && result.width >= MIN_OUTPUT_SIDE) return result;
      if (result.width >= MIN_OUTPUT_SIDE && result.bytes > MAX_OUTPUT_BYTES && width === 640 && result.bytes <= ABSOLUTE_MAX_BYTES) return result;
    }
  }
  if (best && best.bytes <= ABSOLUTE_MAX_BYTES && best.width >= MIN_OUTPUT_SIDE) return best;
  throw new Error(`Could not encode acceptable WebP; best=${best?.bytes ?? 'unknown'} bytes`);
}

function isLocalGood(file, manifestRow) {
  if (!manifestRow || !['completed', 'upgraded'].includes(manifestRow.status)) return false;
  return Number(manifestRow.bytes || 0) >= MIN_ACCEPTABLE_BYTES && Number(manifestRow.width || 0) >= MIN_OUTPUT_SIDE;
}

async function main() {
  await ensureDirs();
  const catalog = await loadCatalog();
  const manifest = await loadManifest();
  const selectedAll = catalog.rows.filter((recipe) => {
    const latest = manifest.get(recipe.recipeId);
    if (FORCE) return true;
    return !isLocalGood(path.join(IMAGE_ROOT, recipe.recipeId, 'hero.webp'), latest);
  });
  const work = selectedAll.slice(START, LIMIT > 0 ? START + LIMIT : undefined);
  const stats = {
    startedAt: now(),
    catalog: catalog.path,
    totalRecipes: catalog.rows.length,
    selected: work.length,
    skipped: catalog.rows.length - selectedAll.length,
    completed: 0,
    failed: 0,
    concurrency: CONCURRENCY,
    delayMs: DELAY_MS,
    maxBytes: MAX_OUTPUT_BYTES,
    minAcceptableBytes: MIN_ACCEPTABLE_BYTES,
    minOutputSide: MIN_OUTPUT_SIDE,
  };
  console.log(JSON.stringify(stats, null, 2));

  let cursor = 0;
  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= work.length) return;
      const recipe = work[i];
      try {
        const source = await resolveImage(recipe);
        const packed = await encodeBest(source.body);
        const dir = path.join(IMAGE_ROOT, recipe.recipeId);
        const file = path.join(dir, 'hero.webp');
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(file, packed.output);
        const row = {
          recipeId: recipe.recipeId,
          recipeName: recipe.name,
          status: 'completed',
          sourceType: 'epicurious-page',
          sourcePageUrl: source.pageUrl,
          sourceImageUrl: source.imageUrl,
          sourceWidth: source.sourceWidth,
          sourceHeight: source.sourceHeight,
          width: packed.width,
          height: packed.height,
          bytes: packed.bytes,
          quality: packed.quality,
          localPath: path.relative(ROOT, file),
          sha256: hash(packed.output),
          completedAt: now(),
        };
        await append(MANIFEST, row);
        manifest.set(recipe.recipeId, row);
        stats.completed += 1;
        if (stats.completed % 25 === 0) console.log(JSON.stringify({ progress: stats.completed + stats.failed, ...stats, last: row }, null, 2));
        else console.log(`[COMPLETED] ${recipe.recipeId} ${recipe.name} ${source.sourceWidth}x${source.sourceHeight} -> ${packed.width}x${packed.height} ${packed.bytes}B`);
      } catch (error) {
        const row = { recipeId: recipe.recipeId, recipeName: recipe.name, status: 'failed', reason: error instanceof Error ? error.message : String(error), failedAt: now() };
        await append(MANIFEST, row);
        await append(FAILURES, row);
        stats.failed += 1;
        console.error(`[FAILED] ${recipe.recipeId} ${recipe.name}: ${row.reason}`);
      }
      await sleep(DELAY_MS);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, work.length) }, () => worker()));
  stats.finishedAt = now();
  stats.status = stats.failed === 0 ? 'complete' : 'incomplete';
  await fs.writeFile(SUMMARY, JSON.stringify(stats, null, 2));
  console.log(JSON.stringify(stats, null, 2));
  if (stats.failed > 0) process.exitCode = 1;
}

main().catch(async (error) => {
  console.error(error);
  await ensureDirs().catch(() => {});
  await append(FAILURES, { status: 'fatal', reason: error instanceof Error ? error.message : String(error), failedAt: now() }).catch(() => {});
  process.exit(1);
});
