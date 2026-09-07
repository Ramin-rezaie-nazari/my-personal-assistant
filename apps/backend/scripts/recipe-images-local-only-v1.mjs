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
const MAX_SEARCH_RESULTS = 8;
const MAX_IMAGE_CANDIDATES = 24;
const PAGE_TIMEOUT_MS = 20000;
const IMAGE_TIMEOUT_MS = 20000;
const MAX_OUTPUT_BYTES = 150 * 1024;
const MIN_OUTPUT_BYTES = 20 * 1024;
const MIN_SOURCE_SIDE = 640;
const MIN_OUTPUT_SIDE = 640;
const MAX_SOURCE_RATIO = 2.5;
const USER_AGENT = 'MYPA-recipe-media-local/2.0';

const SOURCE_DOMAINS = [
  'epicurious.com',
  'bonappetit.com',
  'foodandwine.com',
  'seriouseats.com',
  'allrecipes.com',
  'bbcgoodfood.com',
  'tasteofhome.com',
  'simplyrecipes.com',
  'thekitchn.com',
  'delish.com',
  'eatingwell.com',
  'cooking.nytimes.com',
  'foodnetwork.com',
  'recipetineats.com',
  'loveandlemons.com',
  'onceuponachef.com',
];

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
  if (!ensureFileExists(CATALOG)) throw new Error(`Local recipe catalog not found: ${CATALOG}`);
  const text = await fs.readFile(CATALOG, 'utf8');
  const recipes = [];
  const seen = new Set();
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      const id = String(row.recipeId || row.id || '').trim();
      const name = String(row.name || row.recipeName || '').trim();
      if (id && name && !seen.has(id)) {
        seen.add(id);
        recipes.push({ id, name });
      }
    } catch {}
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

function decodeSafe(value) {
  try { return decodeURIComponent(value); } catch { return value; }
}

function cleanText(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((x) => x.length > 2);
}

function textSimilarity(a, b) {
  const left = new Set(tokenize(a));
  const right = new Set(tokenize(b));
  if (!left.size || !right.size) return 0;
  let hit = 0;
  for (const token of left) if (right.has(token)) hit += 1;
  return hit / Math.max(left.size, right.size);
}

function sourceDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; }
}

function allowedDomain(url) {
  const host = sourceDomain(url);
  return SOURCE_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
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
      Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
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

function addImageCandidate(list, value, score = 50) {
  const url = normalizeUrl(value ? decodeSafe(String(value)) : null);
  if (!url) return;
  const lower = url.toLowerCase();
  if (/encrypted-tbn|gstatic\.com\/images\/branding|googleusercontent\.com\/static/i.test(lower)) return;
  if (!/\.(?:jpe?g|png|webp)(?:[?#]|$)/i.test(url) && !/(image|photo|media|upload|assets)/i.test(lower)) return;
  list.push({ url, score });
}

function extractJsonLdImages(html) {
  const out = [];
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const json = JSON.parse(m[1].trim());
      const visit = (node) => {
        if (!node) return;
        if (Array.isArray(node)) { for (const item of node) visit(item); return; }
        if (typeof node !== 'object') return;
        if (node.image) {
          const image = node.image;
          if (typeof image === 'string') out.push(image);
          else if (Array.isArray(image)) for (const item of image) {
            if (typeof item === 'string') out.push(item);
            else if (item?.url) out.push(item.url);
          }
          else if (image?.url) out.push(image.url);
        }
        if (node.itemListElement) visit(node.itemListElement);
        if (node['@graph']) visit(node['@graph']);
      };
      visit(json);
    } catch {}
  }
  return out;
}

function extractPageMetadata(html) {
  const values = [];
  const meta = (pattern) => {
    const m = html.match(pattern);
    return m ? cleanText(decodeSafe(m[1])) : '';
  };
  values.push(meta(/<title[^>]*>([\s\S]*?)<\/title>/i));
  values.push(meta(/<meta[^>]+(?:property|name)=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i));
  values.push(meta(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:title["'][^>]*>/i));
  return values.filter(Boolean).join(' | ');
}

function extractImageCandidates(html, recipe) {
  const found = [];
  for (const url of extractJsonLdImages(html)) addImageCandidate(found, url, 0);
  for (const m of html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]+content=["']([^"']+)["'][^>]*>/gi)) addImageCandidate(found, m[1], 5);
  for (const m of html.matchAll(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]*>/gi)) addImageCandidate(found, m[1], 5);
  for (const m of html.matchAll(/(?:src|data-src|data-original)=["']([^"']+)["']/gi)) addImageCandidate(found, m[1], 30);
  for (const m of html.matchAll(/srcset=["']([^"']+)["']/gi)) {
    for (const item of m[1].split(',')) addImageCandidate(found, item.trim().split(/\s+/)[0], 25);
  }

  const pageText = extractPageMetadata(html);
  const similarity = textSimilarity(recipe.name, pageText);
  const seen = new Set();
  return found
    .map((item) => ({ ...item, score: item.score - Math.round(similarity * 20) }))
    .sort((a, b) => a.score - b.score)
    .filter((item) => {
      const key = item.url.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_IMAGE_CANDIDATES);
}

function extractSearchLinks(html) {
  const links = [];
  const add = (value) => {
    const url = normalizeUrl(decodeSafe(value));
    if (!url || !allowedDomain(url)) return;
    try {
      const u = new URL(url);
      u.hash = '';
      links.push(u.toString());
    } catch {}
  };
  for (const m of html.matchAll(/href=["']([^"']+)["']/gi)) add(m[1]);
  for (const m of html.matchAll(/https?:\/\/[^"'<>\s]+/gi)) add(m[0]);
  return [...new Set(links)];
}

async function searchEngine(url) {
  const response = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/140 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  const html = await response.text();
  if (!response.ok) throw new Error(`Search ${response.status}`);
  return html;
}

function searchUrls(recipe) {
  const quoted = `"${recipe.name.replace(/"/g, '')}" recipe`;
  const siteClause = SOURCE_DOMAINS.map((domain) => `site:${domain}`).join(' OR ');
  return [
    `https://www.google.com/search?hl=en&gl=us&q=${encodeURIComponent(`${quoted} (${siteClause})`)}`,
    `https://www.bing.com/search?q=${encodeURIComponent(`${quoted} (${siteClause})`)}`,
  ];
}

function scorePage(url, recipe, html = '') {
  const domain = sourceDomain(url);
  const pageTitle = extractPageMetadata(html);
  const slug = slugify(recipe.name);
  let score = 0;
  if (url.toLowerCase().includes(slug)) score -= 80;
  if (pageTitle) score -= Math.round(textSimilarity(recipe.name, pageTitle) * 100);
  if (/(recipe|recipes|dish)/i.test(url)) score -= 10;
  if (domain === 'epicurious.com') score -= 5;
  return score;
}

async function tryPageForImage(recipe, pageUrl) {
  if (!allowedDomain(pageUrl)) return null;
  try {
    const page = await fetchPage(pageUrl);
    const candidates = extractImageCandidates(page.html, recipe);
    for (const candidate of candidates) {
      try {
        const body = await fetchImage(candidate.url);
        const source = await validateSource(body);
        return {
          body,
          pageUrl: page.finalUrl,
          imageUrl: candidate.url,
          sourceWidth: source.width,
          sourceHeight: source.height,
          sourceType: sourceDomain(page.finalUrl),
        };
      } catch {}
    }
  } catch {}
  return null;
}

async function resolveImage(recipe) {
  let lastError = null;
  const candidates = new Map();
  const addPage = (url, score = 0) => {
    const normalized = normalizeUrl(url);
    if (!normalized || !allowedDomain(normalized)) return;
    const prev = candidates.get(normalized) ?? 9999;
    if (score < prev) candidates.set(normalized, score);
  };

  const slug = slugify(recipe.name);
  for (const domain of SOURCE_DOMAINS) {
    addPage(`https://${domain}/recipes/${slug}`, 200);
    addPage(`https://${domain}/recipe/${slug}`, 220);
  }

  for (const searchUrl of searchUrls(recipe)) {
    try {
      const html = await searchEngine(searchUrl);
      const links = extractSearchLinks(html)
        .map((url) => ({ url, score: scorePage(url, recipe, html) }))
        .sort((a, b) => a.score - b.score)
        .slice(0, MAX_SEARCH_RESULTS);
      for (const item of links) addPage(item.url, item.score);
    } catch (error) {
      lastError = error;
    }
  }

  const orderedPages = [...candidates.entries()]
    .sort((a, b) => a[1] - b[1])
    .slice(0, MAX_SEARCH_RESULTS * 2)
    .map(([url]) => url);

  for (const pageUrl of orderedPages) {
    const result = await tryPageForImage(recipe, pageUrl);
    if (result) return result;
    lastError = new Error(`No usable image at ${pageUrl}`);
  }

  throw lastError || new Error(`No usable recipe image found across configured sources`);
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
      if (result.width < MIN_OUTPUT_SIDE || Math.min(result.width, result.height) < MIN_OUTPUT_SIDE) continue;
      if (!best || Math.abs(result.bytes - MAX_OUTPUT_BYTES * 0.75) < Math.abs(best.bytes - MAX_OUTPUT_BYTES * 0.75)) best = result;
      if (result.bytes >= MIN_OUTPUT_BYTES && result.bytes <= MAX_OUTPUT_BYTES) return result;
    }
  }

  if (best && best.bytes >= MIN_OUTPUT_BYTES && best.bytes <= MAX_OUTPUT_BYTES) return best;
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
    const minSide = Math.min(Number(metadata.width || 0), Number(metadata.height || 0));
    if (metadata.format === 'webp' && minSide >= MIN_OUTPUT_SIDE && body.length >= MIN_OUTPUT_BYTES && body.length <= MAX_OUTPUT_BYTES) {
      return { file, bytes: body.length, width: metadata.width, height: metadata.height };
    }
  } catch {}
  return null;
}

async function main() {
  await ensureDirs();
  const recipes = await loadCatalog();
  const manifest = await loadManifest();
  const eligible = recipes.filter((recipe) => FORCE || manifest.get(recipe.id)?.status !== 'complete');
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
    sources: SOURCE_DOMAINS,
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
          sourceType: source.sourceType,
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
        console.log(`[COMPLETE] ${recipe.id} ${recipe.name} [${source.sourceType}] ${source.sourceWidth}x${source.sourceHeight} -> ${packed.width}x${packed.height} ${packed.bytes}B q${packed.quality}`);
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

  const finalManifest = await loadManifest();
  let finalComplete = 0;
  for (const recipe of recipes) {
    if (finalManifest.get(recipe.id)?.status === 'complete') finalComplete += 1;
  }
  stats.finishedAt = now();
  stats.finalComplete = finalComplete;
  stats.finalRemaining = recipes.length - finalComplete;
  stats.status = stats.finalRemaining === 0 ? 'complete' : 'incomplete';
  await fs.writeFile(SUMMARY_PATH, JSON.stringify(stats, null, 2));
  console.log(JSON.stringify(stats, null, 2));
  if (stats.finalRemaining > 0) process.exitCode = 1;
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : String(error));
  await ensureDirs().catch(() => {});
  await appendJsonl(FAILURE_PATH, { status: 'fatal', reason: error instanceof Error ? error.message : String(error), failedAt: now() }).catch(() => {});
  process.exit(1);
});
