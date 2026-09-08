import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const ROOT = path.resolve(process.env.RECIPE_LOCAL_ROOT || './data/mypa-recipe-media-local');
const IMAGE_ROOT = path.join(ROOT, 'images', 'recipes');
const MANIFEST_DIR = path.join(ROOT, 'manifest');
const MANIFEST_PATH = path.join(MANIFEST_DIR, 'recipe-heroes.jsonl');
const FAILURE_PATH = path.join(MANIFEST_DIR, 'failures.jsonl');
const SUMMARY_PATH = path.join(MANIFEST_DIR, 'summary.json');
const CATALOG = process.env.RECIPE_LOCAL_CATALOG?.trim()
  ? path.resolve(process.env.RECIPE_LOCAL_CATALOG)
  : path.resolve('./data/mypa-recipe-media/recipe-catalog.jsonl');

const START = Math.max(Number(process.env.RECIPE_LOCAL_START || '0'), 0);
const LIMIT = Math.max(Number(process.env.RECIPE_LOCAL_LIMIT || '0'), 0);
const CONCURRENCY = Math.min(Math.max(Number(process.env.RECIPE_LOCAL_CONCURRENCY || '4'), 1), 8);
const DELAY_MS = Math.max(Number(process.env.RECIPE_LOCAL_DELAY_MS || '450'), 0);
const FORCE = process.env.RECIPE_LOCAL_FORCE === '1';
const AUDIT_EXISTING = process.env.RECIPE_LOCAL_AUDIT_EXISTING !== '0';
const PAGE_TIMEOUT_MS = 10000;
const IMAGE_TIMEOUT_MS = 12000;
const SEARCH_TIMEOUT_MS = 10000;
const MAX_OUTPUT_BYTES = 150 * 1024;
const MIN_OUTPUT_BYTES = 20 * 1024;
const MIN_SOURCE_SIDE = 640;
const MIN_OUTPUT_SIDE = 640;
const MAX_SOURCE_RATIO = 2.5;
const MIN_PAGE_MATCH = 0.72;
const MIN_PAGE_COVERAGE = 0.82;
const MAX_PAGE_RESULTS = 8;
const MAX_IMAGE_CANDIDATES = 12;
const USER_AGENT = 'MYPA-recipe-media-local/strict-v3';

const SOURCE_DOMAINS = [
  'epicurious.com', 'bonappetit.com', 'foodandwine.com', 'seriouseats.com',
  'allrecipes.com', 'bbcgoodfood.com', 'tasteofhome.com', 'simplyrecipes.com',
  'thekitchn.com', 'delish.com', 'eatingwell.com', 'cooking.nytimes.com',
  'foodnetwork.com', 'recipetineats.com', 'loveandlemons.com', 'onceuponachef.com',
];

const BAD_HOSTS = new Set([
  'facebook.com', 'instagram.com', 'pinterest.com', 'youtube.com', 'wikipedia.org',
  'linkedin.com', 'trustpilot.com', 'freedictionary.com', 'duckspecies.org',
  'pa.gov', 'eset.com', 'britishairways.com',
]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const now = () => new Date().toISOString();
const exists = (file) => { try { fsSync.accessSync(file); return true; } catch { return false; } };

function clean(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, '&').replace(/&#x2F;/gi, '/')
    .replace(/\s+/g, ' ').trim();
}

function normalizeTitle(value) {
  return clean(value)
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[“”‘’]/g, "'")
    .replace(/\b(recipe|recipes|food|dish|easy|best|favorite|favourite|classic|homemade|simple)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function tokens(value) { return normalizeTitle(value).split(' ').filter((x) => x.length > 2); }

function matchScore(recipeName, candidateText) {
  const a = normalizeTitle(recipeName);
  const b = normalizeTitle(candidateText);
  if (!a || !b) return { similarity: 0, coverage: 0, exact: false };
  if (a === b || a.includes(b) || b.includes(a)) return { similarity: 1, coverage: 1, exact: true };
  const left = new Set(tokens(a));
  const right = new Set(tokens(b));
  if (!left.size || !right.size) return { similarity: 0, coverage: 0, exact: false };
  let hit = 0;
  for (const t of left) if (right.has(t)) hit += 1;
  return { similarity: hit / Math.max(left.size, right.size), coverage: hit / left.size, exact: false };
}

function pageMatches(recipeName, titleValues) {
  let best = { similarity: 0, coverage: 0, exact: false, text: '' };
  for (const value of titleValues.filter(Boolean)) {
    const score = matchScore(recipeName, value);
    if (score.exact || score.similarity > best.similarity || score.coverage > best.coverage) best = { ...score, text: value };
  }
  return best.exact || (best.similarity >= MIN_PAGE_MATCH && best.coverage >= MIN_PAGE_COVERAGE) ? best : null;
}

function slugify(value) {
  return normalizeTitle(value).replace(/ /g, '-');
}

function sourceDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; }
}

function isAllowedSource(url) {
  const host = sourceDomain(url);
  if (!host || BAD_HOSTS.has(host)) return false;
  return SOURCE_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
}

function isBadHost(url) {
  const host = sourceDomain(url);
  return BAD_HOSTS.has(host) || [...BAD_HOSTS].some((d) => host.endsWith(`.${d}`));
}

function normalizeUrl(value, baseUrl = null) {
  if (!value) return null;
  let raw = String(value).trim().replaceAll('&amp;', '&').replaceAll('\\/', '/');
  try {
    const u = new URL(raw, baseUrl || undefined);
    if (!/^https?:$/i.test(u.protocol)) return null;
    return u.toString();
  } catch { return null; }
}

async function fetchWithTimeout(url, options = {}, timeout = PAGE_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try { return await fetch(url, { ...options, signal: controller.signal, redirect: 'follow' }); }
  finally { clearTimeout(timer); }
}

async function fetchText(url, timeout = PAGE_TIMEOUT_MS) {
  const response = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
    },
  }, timeout);
  const html = await response.text();
  if (!response.ok || html.length < 600) throw new Error(`Page ${response.status || 'empty'}: ${url}`);
  return { html, finalUrl: response.url || url };
}

async function fetchImage(url) {
  const response = await fetchWithTimeout(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.7' },
  }, IMAGE_TIMEOUT_MS);
  if (!response.ok) throw new Error(`Image ${response.status}: ${url}`);
  const body = Buffer.from(await response.arrayBuffer());
  if (body.length < 5000) throw new Error(`Image body too small: ${body.length}`);
  return body;
}

async function validateImage(body) {
  const meta = await sharp(body, { failOn: 'none' }).rotate().metadata();
  const width = Number(meta.width || 0);
  const height = Number(meta.height || 0);
  if (Math.min(width, height) < MIN_SOURCE_SIDE) throw new Error(`Source resolution too small: ${width}x${height}`);
  const ratio = width / height;
  if (ratio < 1 / MAX_SOURCE_RATIO || ratio > MAX_SOURCE_RATIO) throw new Error(`Source aspect ratio rejected: ${ratio.toFixed(2)}`);
  return { width, height };
}

function extractJsonLd(html) {
  const out = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const json = JSON.parse(match[1].trim());
      const visit = (node) => {
        if (!node) return;
        if (Array.isArray(node)) { node.forEach(visit); return; }
        if (typeof node !== 'object') return;
        if (node.name) out.push({ kind: 'name', value: String(node.name) });
        if (node.headline) out.push({ kind: 'title', value: String(node.headline) });
        if (node.description) out.push({ kind: 'description', value: String(node.description) });
        if (node.image) {
          const image = node.image;
          if (typeof image === 'string') out.push({ kind: 'image', value: image });
          else if (Array.isArray(image)) image.forEach((x) => out.push({ kind: 'image', value: typeof x === 'string' ? x : x?.url }));
          else if (image?.url) out.push({ kind: 'image', value: image.url });
        }
        visit(node['@graph']);
        visit(node.itemListElement);
      };
      visit(json);
    } catch {}
  }
  return out.filter((x) => x.value);
}

function extractTitles(html) {
  const values = [];
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  if (title) values.push(clean(title));
  for (const re of [
    /<meta[^>]+(?:property|name)=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:title["'][^>]*>/gi,
  ]) for (const m of html.matchAll(re)) values.push(clean(m[1]));
  for (const item of extractJsonLd(html)) if (item.kind === 'name' || item.kind === 'title') values.push(clean(item.value));
  return [...new Set(values.filter(Boolean))];
}

function extractPageImages(html, baseUrl) {
  const found = [];
  const add = (value, score, source) => {
    const url = normalizeUrl(value, baseUrl);
    if (!url || isBadHost(url)) return;
    const lower = url.toLowerCase();
    if (/sprite|logo|icon|avatar|favicon|pixel|tracking|placeholder/i.test(lower)) score += 100;
    if (!/\.(?:jpe?g|png|webp|avif)(?:[?#]|$)/i.test(url) && !/(image|photo|media|upload|assets|cdn)/i.test(lower)) return;
    found.push({ url, score, source });
  };
  const jsonLd = extractJsonLd(html);
  for (const item of jsonLd) if (item.kind === 'image') add(item.value, 0, 'jsonld');
  for (const m of html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]+content=["']([^"']+)["'][^>]*>/gi)) add(m[1], 5, 'meta');
  for (const m of html.matchAll(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]*>/gi)) add(m[1], 5, 'meta');
  for (const m of html.matchAll(/<img[^>]+(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["'][^>]*>/gi)) add(m[1], 25, 'img');
  for (const m of html.matchAll(/srcset=["']([^"']+)["']/gi)) for (const item of m[1].split(',')) add(item.trim().split(/\s+/)[0], 20, 'srcset');
  const unique = new Map();
  for (const item of found) {
    const prior = unique.get(item.url);
    if (!prior || item.score < prior.score) unique.set(item.url, item);
  }
  return [...unique.values()].sort((a, b) => a.score - b.score).slice(0, MAX_IMAGE_CANDIDATES);
}

function extractSearchLinks(html) {
  const out = [];
  const add = (value) => {
    const url = normalizeUrl(value);
    if (!url) return;
    const host = sourceDomain(url);
    if (!host || /google\.|bing\.com$/i.test(host) || /^(mailto|javascript):/i.test(url)) return;
    out.push(url);
  };
  for (const m of html.matchAll(/href=["']([^"']+)["']/gi)) add(m[1]);
  for (const m of html.matchAll(/https?:\/\/[^\s"'<>]+/gi)) add(m[0]);
  return [...new Set(out)];
}

function scoreSearchPage(url, recipeName) {
  const host = sourceDomain(url);
  if (isBadHost(url)) return 999;
  let score = 100;
  const slug = slugify(recipeName);
  const lower = url.toLowerCase();
  if (lower.includes(slug)) score -= 60;
  if (isAllowedSource(url)) score -= 30;
  if (/(recipe|recipes|food|dish|cooking)/i.test(lower)) score -= 15;
  if (/\.(gov|edu)$/i.test(host)) score += 80;
  return score;
}

async function tryVerifiedPage(recipe, pageUrl, resolver) {
  try {
    const page = await fetchText(pageUrl);
    const titles = extractTitles(page.html);
    const match = pageMatches(recipe.name, titles);
    if (!match) return null;
    const images = extractPageImages(page.html, page.finalUrl);
    for (const image of images) {
      try {
        const body = await fetchImage(image.url);
        const source = await validateImage(body);
        return {
          body,
          pageUrl: page.finalUrl,
          imageUrl: image.url,
          sourceWidth: source.width,
          sourceHeight: source.height,
          sourceType: sourceDomain(page.finalUrl),
          resolver,
          matchScore: match.similarity,
          matchCoverage: match.coverage,
          matchedTitle: match.text,
        };
      } catch {}
    }
  } catch {}
  return null;
}

async function resolveKnownSource(recipe) {
  const slug = slugify(recipe.name);
  const paths = [];
  for (const domain of SOURCE_DOMAINS) {
    paths.push(`https://${domain}/recipes/${slug}`, `https://${domain}/recipe/${slug}`);
  }
  for (const url of paths.slice(0, 24)) {
    const result = await tryVerifiedPage(recipe, url, 'known-source-page');
    if (result) return result;
  }
  throw new Error('Known source pages did not yield a verified matching recipe image');
}

async function resolveWebSearch(recipe) {
  const queries = [
    `"${recipe.name.replace(/"/g, '')}" recipe`,
    `"${recipe.name.replace(/"/g, '')}"`,
  ];
  const pages = new Map();
  let last = null;
  for (const query of queries) {
    for (const searchUrl of [
      `https://www.google.com/search?hl=en&gl=us&q=${encodeURIComponent(query)}`,
      `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
    ]) {
      try {
        const response = await fetchWithTimeout(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/140 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        }, SEARCH_TIMEOUT_MS);
        const html = await response.text();
        if (!response.ok) throw new Error(`Search ${response.status}`);
        for (const url of extractSearchLinks(html)) {
          const score = scoreSearchPage(url, recipe.name);
          if (score >= 999) continue;
          const previous = pages.get(url);
          if (!previous || score < previous) pages.set(url, score);
        }
      } catch (error) { last = error; }
    }
  }
  const ordered = [...pages.entries()].sort((a, b) => a[1] - b[1]).slice(0, MAX_PAGE_RESULTS);
  for (const [url] of ordered) {
    const result = await tryVerifiedPage(recipe, url, 'web-recipe-page');
    if (result) return result;
  }
  throw last || new Error('No verified recipe page found');
}

function extractImageSearchPairs(html) {
  const pairs = [];
  const push = (imageUrl, pageUrl, title = '') => {
    const image = normalizeUrl(imageUrl);
    const page = normalizeUrl(pageUrl);
    if (!image) return;
    if (isBadHost(image)) return;
    pairs.push({ imageUrl: image, pageUrl: page, title: clean(title) });
  };
  for (const m of html.matchAll(/\{[^{}]{0,5000}?"ou"\s*:\s*"((?:\\.|[^"\\])+)"[^{}]{0,5000}?"ru"\s*:\s*"((?:\\.|[^"\\])+)"/g)) {
    let image = m[1]; let page = m[2];
    try { image = JSON.parse(`"${image.replaceAll('\\/', '/') }"`); } catch {}
    try { page = JSON.parse(`"${page.replaceAll('\\/', '/') }"`); } catch {}
    push(image, page);
  }
  for (const m of html.matchAll(/\{[^{}]{0,5000}?"murl"\s*:\s*"([^"]+)"[^{}]{0,5000}?"purl"\s*:\s*"([^"]+)"[^{}]{0,5000}?"t"\s*:\s*"([^"]*)"/gi)) push(m[1], m[2], m[3]);
  return pairs;
}

async function resolveImageSearch(recipe, engine) {
  const url = engine === 'google'
    ? `https://www.google.com/search?tbm=isch&hl=en&gl=us&q=${encodeURIComponent(`"${recipe.name.replace(/"/g, '')}" recipe`)}`
    : `https://www.bing.com/images/search?form=HDRSC2&q=${encodeURIComponent(`"${recipe.name.replace(/"/g, '')}" recipe`)}`;
  const response = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/140 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  }, SEARCH_TIMEOUT_MS);
  const html = await response.text();
  if (!response.ok) throw new Error(`${engine} Images ${response.status}`);
  const pairs = extractImageSearchPairs(html).slice(0, MAX_IMAGE_CANDIDATES);
  if (!pairs.length) throw new Error(`${engine} Images returned no verifiable image/page pairs`);
  for (const pair of pairs) {
    if (!pair.pageUrl) continue;
    if (isBadHost(pair.pageUrl)) continue;
    const verified = await tryVerifiedPage(recipe, pair.pageUrl, `${engine}-images`);
    if (!verified) continue;
    try {
      const body = await fetchImage(pair.imageUrl);
      const source = await validateImage(body);
      return { ...verified, body, imageUrl: pair.imageUrl, sourceWidth: source.width, sourceHeight: source.height, resolver: `${engine}-images` };
    } catch {}
  }
  throw new Error(`${engine} Images had no verified matching source page/image`);
}

async function resolveImage(recipe) {
  const resolvers = [
    ['known-source-page', () => resolveKnownSource(recipe)],
    ['web-recipe-page', () => resolveWebSearch(recipe)],
    ['google-images', () => resolveImageSearch(recipe, 'google')],
    ['bing-images', () => resolveImageSearch(recipe, 'bing')],
  ];
  const errors = [];
  for (const [name, fn] of resolvers) {
    try {
      const result = await fn();
      if (result?.body) return result;
    } catch (error) {
      errors.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(`All strict image resolvers exhausted | ${errors.join(' | ')}`);
}

async function encodeWebp(input) {
  let best = null;
  const widths = [1200, 1080, 960, 880, 800, 720, 640];
  const qualities = [90, 84, 78, 72, 66, 60, 54, 48, 42, 36, 30, 24, 18, 12, 8, 4];
  for (const width of widths) {
    for (const quality of qualities) {
      const output = await sharp(input, { failOn: 'none' })
        .rotate().resize({ width, fit: 'inside', withoutEnlargement: true })
        .webp({ quality, effort: 6 }).toBuffer();
      const meta = await sharp(output, { failOn: 'none' }).metadata();
      const result = { output, width: Number(meta.width || width), height: Number(meta.height || width), bytes: output.length, quality };
      if (!best || result.bytes < best.bytes) best = result;
      if (result.width >= MIN_OUTPUT_SIDE && result.height >= MIN_OUTPUT_SIDE && result.bytes >= MIN_OUTPUT_BYTES && result.bytes <= MAX_OUTPUT_BYTES) return result;
    }
  }
  throw new Error(`Could not encode verified image <= ${MAX_OUTPUT_BYTES} bytes; smallest=${best?.bytes ?? 'none'}`);
}

async function sha256(buffer) { return crypto.createHash('sha256').update(buffer).digest('hex'); }

async function loadCatalog() {
  if (!exists(CATALOG)) throw new Error(`Local recipe catalog not found: ${CATALOG}`);
  const text = await fs.readFile(CATALOG, 'utf8');
  const recipes = [];
  const seen = new Set();
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      const id = String(row.recipeId || row.id || '').trim();
      const name = String(row.name || row.recipeName || '').trim();
      if (id && name && !seen.has(id)) { seen.add(id); recipes.push({ id, name }); }
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
      try { const row = JSON.parse(line); if (row.recipeId) map.set(String(row.recipeId), row); } catch {}
    }
    return map;
  } catch (error) { if (error.code === 'ENOENT') return new Map(); throw error; }
}

async function appendJsonl(file, row) { await fs.appendFile(file, `${JSON.stringify(row)}\n`); }

async function auditExisting(recipes, manifest) {
  if (!AUDIT_EXISTING) return { audited: 0, invalidated: 0 };
  let audited = 0;
  let invalidated = 0;
  for (const recipe of recipes) {
    const row = manifest.get(recipe.id);
    if (!row || row.status !== 'complete') continue;
    audited += 1;
    let valid = true;
    if (!row.sourcePageUrl || !row.sourceImageUrl) valid = false;
    const pageMatchesSource = isAllowedSource(row.sourcePageUrl);
    const storedPath = row.localPath ? path.resolve(ROOT, row.localPath) : path.join(IMAGE_ROOT, recipe.id, 'hero.webp');
    if (!exists(storedPath)) valid = false;
    if (row.resolver === 'web-recipe-page' || row.resolver === 'google-images' || row.resolver === 'bing-images' || !pageMatchesSource) {
      try {
        const page = await fetchText(row.sourcePageUrl);
        const match = pageMatches(recipe.name, extractTitles(page.html));
        if (!match) valid = false;
      } catch { valid = false; }
    }
    if (!valid) {
      invalidated += 1;
      await fs.rm(storedPath, { force: true }).catch(() => {});
      const repair = {
        recipeId: recipe.id,
        recipeName: recipe.name,
        status: 'needs_reprocess',
        reason: 'Existing complete image failed strict provenance/title audit',
        previousResolver: row.resolver || null,
        auditedAt: now(),
      };
      await appendJsonl(MANIFEST_PATH, repair);
      manifest.set(recipe.id, repair);
    }
  }
  return { audited, invalidated };
}

async function processOne(recipe, manifest) {
  const existing = manifest.get(recipe.id);
  if (existing?.status === 'complete' && !FORCE) return { status: 'skipped', existing };
  const source = await resolveImage(recipe);
  const packed = await encodeWebp(source.body);
  const target = path.join(IMAGE_ROOT, recipe.id, 'hero.webp');
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, packed.output);
  const row = {
    recipeId: recipe.id,
    recipeName: recipe.name,
    status: 'complete',
    resolver: source.resolver,
    sourceType: source.sourceType,
    sourcePageUrl: source.pageUrl,
    sourceImageUrl: source.imageUrl,
    sourceWidth: source.sourceWidth,
    sourceHeight: source.sourceHeight,
    width: packed.width,
    height: packed.height,
    bytes: packed.bytes,
    quality: packed.quality,
    matchScore: source.matchScore ?? null,
    matchCoverage: source.matchCoverage ?? null,
    matchedTitle: source.matchedTitle ?? null,
    localPath: path.relative(ROOT, target),
    sha256: await sha256(packed.output),
    generatedAt: now(),
  };
  await appendJsonl(MANIFEST_PATH, row);
  manifest.set(recipe.id, row);
  return { status: 'complete', row };
}

async function main() {
  await Promise.all([fs.mkdir(IMAGE_ROOT, { recursive: true }), fs.mkdir(MANIFEST_DIR, { recursive: true })]);
  const recipes = await loadCatalog();
  const manifest = await loadManifest();
  const audit = await auditExisting(recipes, manifest);
  const eligible = recipes.filter((recipe) => FORCE || manifest.get(recipe.id)?.status !== 'complete');
  const work = eligible.slice(START, LIMIT > 0 ? START + LIMIT : undefined);
  const stats = {
    startedAt: now(), totalRecipes: recipes.length, auditedExisting: audit.audited, invalidatedExisting: audit.invalidated,
    eligibleRecipes: eligible.length, selected: work.length, concurrency: CONCURRENCY, delayMs: DELAY_MS,
    resolvers: ['known-source-page', 'web-recipe-page', 'google-images', 'bing-images'], completed: 0, failed: 0, skipped: 0,
  };
  console.log(JSON.stringify(stats, null, 2));

  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= work.length) return;
      const recipe = work[index];
      try {
        const result = await processOne(recipe, manifest);
        if (result.status === 'skipped') {
          stats.skipped += 1;
          console.log(`[SKIPPED] ${recipe.id} ${recipe.name}`);
        } else {
          stats.completed += 1;
          const row = result.row;
          console.log(`[COMPLETE] ${recipe.id} ${recipe.name} [${row.resolver}] [${row.sourceType}] match=${row.matchScore ?? 'n/a'} coverage=${row.matchCoverage ?? 'n/a'} ${row.sourceWidth}x${row.sourceHeight} -> ${row.width}x${row.height} ${row.bytes}B q${row.quality}`);
        }
      } catch (error) {
        stats.failed += 1;
        const reason = error instanceof Error ? error.message : String(error);
        await appendJsonl(FAILURE_PATH, { recipeId: recipe.id, recipeName: recipe.name, status: 'failed', reason, failedAt: now() });
        await appendJsonl(MANIFEST_PATH, { recipeId: recipe.id, recipeName: recipe.name, status: 'failed', reason, failedAt: now() });
        manifest.set(recipe.id, { status: 'failed', recipeId: recipe.id, recipeName: recipe.name, reason });
        console.error(`[FAILED] ${recipe.id} ${recipe.name}: ${reason}`);
      }
      if (DELAY_MS) await sleep(DELAY_MS);
    }
  }

  process.on('SIGINT', async () => {
    stats.interruptedAt = now();
    stats.status = 'interrupted';
    await fs.writeFile(SUMMARY_PATH, JSON.stringify(stats, null, 2));
    console.error('\n[INTERRUPTED] Progress summary written. Safe to rerun; completed verified images are retained.');
    process.exit(130);
  });

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, work.length) }, () => worker()));
  const finalManifest = await loadManifest();
  let finalComplete = 0;
  for (const recipe of recipes) if (finalManifest.get(recipe.id)?.status === 'complete') finalComplete += 1;
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
  await fs.mkdir(MANIFEST_DIR, { recursive: true }).catch(() => {});
  await appendJsonl(FAILURE_PATH, { status: 'fatal', reason: error instanceof Error ? error.message : String(error), failedAt: now() }).catch(() => {});
  process.exit(1);
});
