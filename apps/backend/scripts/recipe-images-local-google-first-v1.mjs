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
const MIN_SIDE = Math.max(Number(process.env.RECIPE_GOOGLE_LOCAL_MIN_SIDE || '480'), 240);
const TARGET_BYTES = Math.max(Number(process.env.RECIPE_GOOGLE_LOCAL_TARGET_BYTES || '150000'), 30000);
const CONCURRENCY = Math.min(Math.max(Number(process.env.RECIPE_GOOGLE_LOCAL_CONCURRENCY || '3'), 1), 6);
const DELAY_MS = Math.max(Number(process.env.RECIPE_GOOGLE_LOCAL_DELAY_MS || '1400'), 0);
const SEARCH_TIMEOUT_MS = Math.max(Number(process.env.RECIPE_GOOGLE_LOCAL_SEARCH_TIMEOUT_MS || '15000'), 5000);
const IMAGE_TIMEOUT_MS = Math.max(Number(process.env.RECIPE_GOOGLE_LOCAL_IMAGE_TIMEOUT_MS || '20000'), 5000);
const LIMIT = Math.max(Number(process.env.RECIPE_GOOGLE_LOCAL_LIMIT || '0'), 0);
const FORCE = process.env.RECIPE_GOOGLE_LOCAL_FORCE === '1';
const USER_AGENT = process.env.RECIPE_GOOGLE_LOCAL_USER_AGENT || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const exists = (file) => { try { fsSync.accessSync(file); return true; } catch { return false; } };
const host = (url) => { try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; } };
const normalizeUrl = (value) => {
  if (!value) return null;
  let v = String(value).trim().replaceAll('\\u003d', '=').replaceAll('\\u0026', '&').replaceAll('\\/', '/');
  try { v = decodeURIComponent(v); } catch {}
  if (v.startsWith('//')) v = `https:${v}`;
  return /^https?:\/\//i.test(v) ? v : null;
};

async function appendJsonl(file, row) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.appendFile(file, JSON.stringify(row) + '\n');
}

async function loadCatalog() {
  if (!exists(CATALOG)) throw new Error(`Catalog not found: ${CATALOG}`);
  return (await fs.readFile(CATALOG, 'utf8'))
    .split(/\r?\n/).filter(Boolean).map(JSON.parse)
    .map((row) => ({ recipeId: String(row.recipeId || row.id || ''), name: String(row.name || row.recipeName || '') }))
    .filter((row) => row.recipeId && row.name);
}

function decodeGoogleUrl(raw) {
  let value = String(raw).replaceAll('\\/', '/').replaceAll('\\u003d', '=').replaceAll('\\u0026', '&');
  try { value = JSON.parse(`"${value.replaceAll('"', '\\"')}"`); } catch {}
  try { value = decodeURIComponent(value); } catch {}
  return normalizeUrl(value);
}

function extractFirstGoogleImage(html) {
  const patterns = [
    /"ou"\s*:\s*"((?:\\.|[^"\\])+)"/,
    /\\"ou\\"\s*:\s*\\"((?:\\.|[^"\\])+)\\"/,
    /[?&]imgurl=([^&"']+)/,
    /data-iurl=["']([^"']+)["']/,
    /data-original=["']([^"']+)["']/,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (!match) continue;
    const url = decodeGoogleUrl(match[1]);
    if (url && !/gstatic\.com\/images\/branding|googleusercontent\.com\/static|sprite|logo|icon|avatar|favicon|pixel|tracking|placeholder/i.test(url.toLowerCase())) {
      return url;
    }
  }
  return null;
}

async function googleFirstImage(recipeName) {
  const query = `${recipeName} recipe`;
  const searchUrl = `https://www.google.com/search?tbm=isch&hl=en&gl=us&q=${encodeURIComponent(query)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
  try {
    const response = await fetch(searchUrl, {
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
    const imageUrl = extractFirstGoogleImage(html);
    if (!imageUrl) throw new Error(/captcha|unusual traffic|not a robot|consent/i.test(html) ? 'Google challenge/blocked' : 'Google returned no first image URL');
    return { query, searchUrl, imageUrl, resultPosition: 1 };
  } finally {
    clearTimeout(timer);
  }
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
    if (!body.length) throw new Error('empty image');
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

  let best = null;
  const widths = [1600, 1400, 1280, 1200, 1080, 960, 880, 800, 720, 640, 576, 512, 480];
  const qualities = [92, 88, 84, 80, 76, 72, 68, 64, 60, 56, 52, 48, 44, 40, 36, 32, 28, 24, 20, 16, 12, 8];
  for (const width of widths) {
    for (const quality of qualities) {
      const out = await input.clone()
        .resize({ width, fit: 'inside', withoutEnlargement: true })
        .webp({ quality, effort: 6 })
        .toBuffer();
      const outMeta = await sharp(out, { failOn: 'none' }).metadata();
      const item = {
        out,
        width: Number(outMeta.width || width),
        height: Number(outMeta.height || 0),
        bytes: out.byteLength,
        quality,
      };
      if (Math.min(item.width, item.height) < MIN_SIDE) continue;
      if (!best || Math.abs(item.bytes - TARGET_BYTES) < Math.abs(best.bytes - TARGET_BYTES)) best = item;
      if (item.bytes <= TARGET_BYTES) {
        // Keep searching briefly through the remaining quality/size combinations,
        // then select the closest variant that does not exceed the target.
      }
    }
  }
  if (!best) throw new Error('no acceptable WebP variant');

  // Prefer the largest file at or below the target. This keeps visual quality high
  // while naturally landing near the requested ~150KB size.
  const underTarget = [];
  for (const width of widths) {
    for (const quality of qualities) {
      const out = await input.clone()
        .resize({ width, fit: 'inside', withoutEnlargement: true })
        .webp({ quality, effort: 6 })
        .toBuffer();
      const m = await sharp(out, { failOn: 'none' }).metadata();
      if (Math.min(Number(m.width || width), Number(m.height || 0)) < MIN_SIDE) continue;
      if (out.byteLength <= TARGET_BYTES) underTarget.push({ out, width: Number(m.width || width), height: Number(m.height || 0), bytes: out.byteLength, quality });
    }
  }
  if (underTarget.length) {
    underTarget.sort((a, b) => b.bytes - a.bytes);
    return underTarget[0];
  }
  return best;
}

async function hasLocalHero(recipeId) {
  const dir = path.join(IMAGE_ROOT, recipeId);
  return ['hero.webp', '01.webp'].some((name) => exists(path.join(dir, name)));
}

async function saveHero(recipe, found, prepared) {
  const dir = path.join(IMAGE_ROOT, recipe.recipeId);
  await fs.mkdir(dir, { recursive: true });
  const heroPath = path.join(dir, 'hero.webp');
  await fs.writeFile(heroPath, prepared.out);
  const hash = crypto.createHash('sha256').update(prepared.out).digest('hex');
  await appendJsonl(MANIFEST, {
    recipeId: recipe.recipeId,
    recipeName: recipe.name,
    imageType: 'hero',
    file: path.relative(ROOT, heroPath),
    source: 'google-images-first-result',
    sourceImageUrl: found.imageUrl,
    query: found.query,
    searchUrl: found.searchUrl,
    resultPosition: 1,
    verified: false,
    confidence: 'unverified',
    width: prepared.width,
    height: prepared.height,
    bytes: prepared.bytes,
    sha256: hash,
    downloadedAt: new Date().toISOString(),
  });
}

async function processRecipe(recipe) {
  if (!FORCE && await hasLocalHero(recipe.recipeId)) return 'skip';
  const found = await googleFirstImage(recipe.name);
  const body = await downloadImage(found.imageUrl);
  const prepared = await prepareImage(body);
  await saveHero(recipe, found, prepared);
  return 'complete';
}

async function main() {
  const catalog = await loadCatalog();
  const candidates = [];
  for (const recipe of catalog) if (FORCE || !(await hasLocalHero(recipe.recipeId))) candidates.push(recipe);
  const selected = LIMIT > 0 ? candidates.slice(0, LIMIT) : candidates;
  const stats = { totalCatalog: catalog.length, selected: selected.length, complete: 0, failed: 0, skipped: catalog.length - candidates.length };
  console.log(JSON.stringify({ engine: 'local-google-first-v2', localOnly: true, policy: 'Google Images result #1 only', targetBytes: TARGET_BYTES, ...stats }, null, 2));

  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= selected.length) return;
      const recipe = selected[index];
      try {
        const status = await processRecipe(recipe);
        if (status === 'skip') {
          stats.skipped += 1;
          console.log(`[SKIP] ${recipe.name}`);
        } else {
          stats.complete += 1;
          console.log(`[COMPLETE ${stats.complete}] ${recipe.name} -> 1 image [Google result #1]`);
        }
      } catch (error) {
        stats.failed += 1;
        const reason = error instanceof Error ? error.message : String(error);
        await appendJsonl(FAILURE, { recipeId: recipe.recipeId, recipeName: recipe.name, status: 'pending-retry', reason, index, updatedAt: new Date().toISOString() });
        console.error(`[FAILED/PENDING] ${recipe.name}: ${reason}`);
      }
      await sleep(DELAY_MS);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, selected.length) }, () => worker()));
  const missingAfterRun = catalog.length - stats.skipped - stats.complete;
  console.log(JSON.stringify({ status: missingAfterRun === 0 ? 'complete' : 'partial', ...stats, missingAfterRun }, null, 2));
  process.exitCode = missingAfterRun ? 2 : 0;
}

main().catch((error) => { console.error(error); process.exit(1); });
