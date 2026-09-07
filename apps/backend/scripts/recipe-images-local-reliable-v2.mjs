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
const CONCURRENCY = Math.min(Math.max(Number(process.env.RECIPE_LOCAL_CONCURRENCY || '4'), 1), 8);
const DELAY_MS = Math.max(Number(process.env.RECIPE_LOCAL_DELAY_MS || '500'), 0);
const FORCE = process.env.RECIPE_LOCAL_FORCE === '1';
const MAX_SEARCH_RESULTS = 10;
const MAX_PAGE_CANDIDATES = 12;
const MAX_IMAGE_CANDIDATES = 12;
const PAGE_TIMEOUT_MS = 15000;
const IMAGE_TIMEOUT_MS = 15000;
const MAX_OUTPUT_BYTES = 150 * 1024;
const MIN_OUTPUT_BYTES = 20 * 1024;
const MIN_SOURCE_SIDE = 640;
const MIN_OUTPUT_SIDE = 640;
const MAX_SOURCE_RATIO = 2.5;
const MIN_IMAGE_SCORE = 10;
const USER_AGENT = 'MYPA-recipe-media-local/3.0';

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

function fileExists(file) {
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
  if (!fileExists(CATALOG)) throw new Error(`Local recipe catalog not found: ${CATALOG}`);
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

function decodeSafe(value) {
  let out = String(value || '');
  for (let i = 0; i < 2; i += 1) {
    try {
      const decoded = decodeURIComponent(out);
      if (decoded === out) break;
      out = decoded;
    } catch {
      break;
    }
  }
  return out;
}

function cleanText(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&#x2F;/gi, '/')
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
    .filter((token) => token.length > 2);
}

function textSimilarity(a, b) {
  const left = new Set(tokenize(a));
  const right = new Set(tokenize(b));
  if (!left.size || !right.size) return 0;
  let hit = 0;
  for (const token of left) if (right.has(token)) hit += 1;
  return hit / Math.max(left.size, right.size);
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

function sourceDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; }
}

function isSourceDomain(url) {
  const host = sourceDomain(url);
  return SOURCE_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function normalizeUrl(value, baseUrl = null) {
  if (!value) return null;
  let raw = decodeSafe(String(value).trim())
    .replaceAll('&amp;', '&')
    .replaceAll('\\u003d', '=')
    .replaceAll('\\u0026', '&')
    .replaceAll('\\/', '/');
  if (raw.startsWith('//')) raw = `https:${raw}`;
  try {
    const url = new URL(raw, baseUrl || undefined);
    if (!/^https?:$/i.test(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = PAGE_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal, redirect: 'follow' });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPage(url) {
  const response = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
    },
  });
  const html = await response.text();
  if (!response.ok || html.length < 700) throw new Error(`Page ${response.status || 'empty'}: ${url}`);
  return { html, finalUrl: response.url || url };
}

async function fetchImage(url) {
  const response = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.7',
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
  if (ratio < 1 / MAX_SOURCE_RATIO || ratio > MAX_SOURCE_RATIO) {
    throw new Error(`Source aspect ratio rejected: ${ratio.toFixed(2)}`);
  }
  return { width, height, format: metadata.format || 'unknown' };
}

function candidateImage(list, value, score, sourceHint = null) {
  const url = normalizeUrl(value);
  if (!url) return;
  const lower = url.toLowerCase();
  if (/gstatic\.com\/images\/branding|googleusercontent\.com\/static|bing\.com\/th\?|encrypted-tbn/i.test(lower)) return;
  if (/sprite|logo|icon|avatar|favicon|pixel|tracking|placeholder/i.test(lower)) score += 80;
  if (!/\.(?:jpe?g|png|webp|avif)(?:[?#]|$)/i.test(url) && !/(image|photo|media|upload|assets|cdn)/i.test(lower)) return;
  list.push({ url, score, sourceHint });
}

function extractJsonLd(html) {
  const out = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const json = JSON.parse(match[1].trim());
      const visit = (node) => {
        if (!node) return;
        if (Array.isArray(node)) {
          for (const item of node) visit(item);
          return;
        }
        if (typeof node !== 'object') return;
        if (node.name) out.push({ kind: 'name', value: String(node.name) });
        if (node.headline) out.push({ kind: 'title', value: String(node.headline) });
        if (node.image) {
          const image = node.image;
          if (typeof image === 'string') out.push({ kind: 'image', value: image });
          else if (Array.isArray(image)) {
            for (const item of image) {
              if (typeof item === 'string') out.push({ kind: 'image', value: item });
              else if (item?.url) out.push({ kind: 'image', value: item.url });
            }
          } else if (image?.url) out.push({ kind: 'image', value: image.url });
        }
        if (node['@graph']) visit(node['@graph']);
        if (node.itemListElement) visit(node.itemListElement);
      };
      visit(json);
    } catch {}
  }
  return out;
}

function pageTitle(html) {
  const values = [];
  const patterns = [
    /<title[^>]*>([\s\S]*?)<\/title>/i,
    /<meta[^>]+(?:property|name)=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:title["'][^>]*>/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) values.push(cleanText(match[1]));
  }
  return [...new Set(values)].join(' | ');
}

function extractPageImages(html, recipe, baseUrl) {
  const found = [];
  const jsonLd = extractJsonLd(html);
  const jsonNames = jsonLd.filter((item) => item.kind === 'name' || item.kind === 'title').map((item) => item.value).join(' | ');
  const similarity = Math.max(textSimilarity(recipe.name, pageTitle(html)), textSimilarity(recipe.name, jsonNames));

  for (const item of jsonLd) if (item.kind === 'image') candidateImage(found, item.value, 0 - Math.round(similarity * 20), 'jsonld');
  for (const match of html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]+content=["']([^"']+)["'][^>]*>/gi)) {
    candidateImage(found, match[1], 5 - Math.round(similarity * 20), 'meta');
  }
  for (const match of html.matchAll(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]*>/gi)) {
    candidateImage(found, match[1], 5 - Math.round(similarity * 20), 'meta');
  }
  for (const match of html.matchAll(/<img[^>]+(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["'][^>]*>/gi)) {
    candidateImage(found, match[1], 30 - Math.round(similarity * 20), 'img');
  }
  for (const match of html.matchAll(/srcset=["']([^"']+)["']/gi)) {
    for (const item of match[1].split(',')) candidateImage(found, item.trim().split(/\s+/)[0], 25 - Math.round(similarity * 20), 'srcset');
  }
  for (const match of html.matchAll(/(?:data-image|data-image-url|data-iurl)=["']([^"']+)["']/gi)) {
    candidateImage(found, match[1], 10 - Math.round(similarity * 20), 'data');
  }

  const unique = new Map();
  for (const item of found) {
    const url = normalizeUrl(item.url, baseUrl);
    if (!url) continue;
    const previous = unique.get(url);
    if (!previous || item.score < previous.score) unique.set(url, { ...item, url });
  }
  return [...unique.values()].sort((a, b) => a.score - b.score).slice(0, MAX_IMAGE_CANDIDATES);
}

function searchResultLinks(html) {
  const links = [];
  const push = (value) => {
    const url = normalizeUrl(value);
    if (!url) return;
    const host = sourceDomain(url);
    if (/google\./i.test(host) || /bing\.com$/i.test(host)) return;
    if (/^mailto:|^javascript:/i.test(url)) return;
    links.push(url);
  };
  for (const match of html.matchAll(/href=["']([^"']+)["']/gi)) push(match[1]);
  for (const match of html.matchAll(/https?:\/\/[^\s"'<>]+/gi)) push(match[0]);
  return [...new Set(links)];
}

function scorePageUrl(url, recipe) {
  const lower = url.toLowerCase();
  const slug = slugify(recipe.name);
  const host = sourceDomain(url);
  let score = 100;
  if (lower.includes(slug)) score -= 80;
  if (isSourceDomain(url)) score -= 25;
  if (/(recipe|recipes|dish|food|cooking)/i.test(lower)) score -= 20;
  if (/(pinterest|facebook|instagram|youtube|amazon|wikipedia)/i.test(host)) score += 100;
  return score;
}

function googleImageSearchUrls(recipe) {
  const q = encodeURIComponent(`"${recipe.name.replace(/"/g, '')}" recipe`);
  return [
    `https://www.google.com/search?tbm=isch&hl=en&gl=us&q=${q}`,
    `https://www.google.com/search?udm=2&hl=en&gl=us&q=${q}`,
  ];
}

function bingImageSearchUrl(recipe) {
  return `https://www.bing.com/images/search?form=HDRSC2&first=1&q=${encodeURIComponent(`"${recipe.name.replace(/"/g, '')}" recipe`)}`;
}

function extractGoogleImages(html) {
  const out = [];
  const patterns = [
    /"ou"\s*:\s*"((?:\\.|[^"\\])+)"/g,
    /\\"ou\\"\s*:\s*\\"((?:\\.|[^"\\])+)\\"/g,
    /[?&]imgurl=([^&"']+)/g,
    /data-iurl=["']([^"']+)["']/g,
  ];
  for (const regex of patterns) {
    for (const match of html.matchAll(regex)) {
      let value = decodeSafe(match[1]);
      if (regex.source.includes('"ou"')) {
        try { value = JSON.parse(`"${value.replaceAll('\\/', '/') }"`); } catch {}
      }
      const url = normalizeUrl(value);
      if (url) out.push(url);
    }
  }
  return [...new Set(out)];
}

function extractBingImages(html) {
  const out = [];
  const patterns = [
    /["']murl["']\s*:\s*["']([^"']+)["']/gi,
    /["']turl["']\s*:\s*["']([^"']+)["']/gi,
    /data-iurl=["']([^"']+)["']/gi,
    /data-murl=["']([^"']+)["']/gi,
  ];
  for (const regex of patterns) {
    for (const match of html.matchAll(regex)) {
      const url = normalizeUrl(match[1]);
      if (url) out.push(url);
    }
  }
  return [...new Set(out)];
}

async function tryImageUrls(recipe, candidates, via, scoreOffset = 0) {
  let lastError = null;
  const seen = new Set();
  const ranked = candidates.map((url, index) => ({ url, score: scoreOffset + index }));
  for (const item of ranked) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    try {
      const body = await fetchImage(item.url);
      const source = await validateSource(body);
      if (item.score > MIN_IMAGE_SCORE) continue;
      return {
        body,
        pageUrl: item.pageUrl || null,
        imageUrl: item.url,
        sourceWidth: source.width,
        sourceHeight: source.height,
        sourceType: item.sourceType || sourceDomain(item.url),
        resolver: via,
      };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error(`No valid image candidate via ${via}`);
}

async function resolveFromKnownSource(recipe) {
  const slug = slugify(recipe.name);
  const pages = [];
  for (const domain of SOURCE_DOMAINS) {
    pages.push(`https://${domain}/recipes/${slug}`);
    pages.push(`https://${domain}/recipe/${slug}`);
  }
  for (const pageUrl of pages.slice(0, MAX_PAGE_CANDIDATES)) {
    try {
      const page = await fetchPage(pageUrl);
      const candidates = extractPageImages(page.html, recipe, page.finalUrl);
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
            resolver: 'known-source-page',
          };
        } catch {}
      }
    } catch {}
  }
  throw new Error('Known source pages did not expose a usable image');
}

async function resolveFromWebSearch(recipe) {
  const queries = [
    `"${recipe.name.replace(/"/g, '')}" recipe`,
    `${recipe.name} recipe`,
  ];
  const pages = new Map();
  let lastError = null;

  for (const query of queries) {
    const urls = [
      `https://www.google.com/search?hl=en&gl=us&q=${encodeURIComponent(query)}`,
      `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
    ];
    for (const searchUrl of urls) {
      try {
        const response = await fetchWithTimeout(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/140 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
          },
        });
        const html = await response.text();
        if (!response.ok) throw new Error(`Search ${response.status}`);
        const links = searchResultLinks(html)
          .map((url) => ({ url, score: scorePageUrl(url, recipe) }))
          .sort((a, b) => a.score - b.score)
          .slice(0, MAX_SEARCH_RESULTS);
        for (const link of links) {
          const previous = pages.get(link.url);
          if (!previous || link.score < previous.score) pages.set(link.url, link);
        }
      } catch (error) {
        lastError = error;
      }
    }
  }

  const ordered = [...pages.values()].sort((a, b) => a.score - b.score).slice(0, MAX_SEARCH_RESULTS);
  for (const pageCandidate of ordered) {
    try {
      const page = await fetchPage(pageCandidate.url);
      const candidates = extractPageImages(page.html, recipe, page.finalUrl);
      if (!candidates.length) continue;
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
            resolver: 'web-recipe-page',
          };
        } catch {}
      }
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Web recipe page search found no usable image');
}

async function resolveFromGoogleImages(recipe) {
  let lastError = null;
  for (const searchUrl of googleImageSearchUrls(recipe)) {
    try {
      const response = await fetchWithTimeout(searchUrl, {
        headers: {
          'User-Agent': process.env.RECIPE_LOCAL_SEARCH_USER_AGENT ||
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/140 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
      });
      const html = await response.text();
      if (!response.ok) throw new Error(`Google Images ${response.status}`);
      const blocked = /captcha|unusual traffic|not a robot|consent/i.test(html) && html.length < 200000;
      if (blocked) throw new Error('Google Images blocked or consent challenge');
      const candidates = extractGoogleImages(html).slice(0, MAX_IMAGE_CANDIDATES);
      if (!candidates.length) throw new Error('Google Images returned no original image URLs');
      return await tryImageUrls(recipe, candidates, 'google-images');
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Google Images resolution failed');
}

async function resolveFromBingImages(recipe) {
  try {
    const searchUrl = bingImageSearchUrl(recipe);
    const response = await fetchWithTimeout(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/140 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    });
    const html = await response.text();
    if (!response.ok) throw new Error(`Bing Images ${response.status}`);
    const candidates = extractBingImages(html).slice(0, MAX_IMAGE_CANDIDATES);
    if (!candidates.length) throw new Error('Bing Images returned no image URLs');
    return await tryImageUrls(recipe, candidates, 'bing-images');
  } catch (error) {
    throw error;
  }
}

async function resolveImage(recipe) {
  const resolvers = [
    ['known-source-page', resolveFromKnownSource],
    ['web-recipe-page', resolveFromWebSearch],
    ['google-images', resolveFromGoogleImages],
    ['bing-images', resolveFromBingImages],
  ];
  const errors = [];
  for (const [name, resolver] of resolvers) {
    try {
      const result = await resolver(recipe);
      if (result?.body) return result;
    } catch (error) {
      errors.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(`All image resolvers exhausted | ${errors.join(' | ')}`);
}

async function encodeWebp(input) {
  let best = null;
  const widths = [1200, 1080, 960, 880, 800, 720, 640];
  const qualities = [90, 86, 82, 78, 74, 70, 66, 62, 58, 54, 50, 46, 42, 38];
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
      if (Math.min(result.width, result.height) < MIN_OUTPUT_SIDE) continue;
      if (!best || Math.abs(result.bytes - MAX_OUTPUT_BYTES * 0.75) < Math.abs(best.bytes - MAX_OUTPUT_BYTES * 0.75)) best = result;
      if (result.bytes >= MIN_OUTPUT_BYTES && result.bytes <= MAX_OUTPUT_BYTES) return result;
    }
  }
  if (best && best.bytes >= MIN_OUTPUT_BYTES && best.bytes <= MAX_OUTPUT_BYTES) return best;
  throw new Error(`Could not encode usable WebP <= ${MAX_OUTPUT_BYTES} bytes`);
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

async function processOne(recipe, manifest) {
  const existing = await loadExistingHero(recipe);
  if (existing && !FORCE) return { status: 'skipped', existing };

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
    localPath: path.relative(ROOT, target),
    sha256: await sha256(packed.output),
    generatedAt: now(),
  };
  await appendJsonl(MANIFEST_PATH, row);
  manifest.set(recipe.id, row);
  return { status: 'complete', row };
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
    concurrency: CONCURRENCY,
    delayMs: DELAY_MS,
    maxBytes: MAX_OUTPUT_BYTES,
    minBytesSanity: MIN_OUTPUT_BYTES,
    minSourceSide: MIN_SOURCE_SIDE,
    resolvers: ['known-source-page', 'web-recipe-page', 'google-images', 'bing-images'],
    completed: 0,
    failed: 0,
    skipped: 0,
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
          console.log(`[SKIPPED] ${recipe.id} ${recipe.name} existing=${result.existing.width}x${result.existing.height}`);
        } else {
          stats.completed += 1;
          const row = result.row;
          console.log(`[COMPLETE] ${recipe.id} ${recipe.name} [${row.resolver}] [${row.sourceType}] ${row.sourceWidth}x${row.sourceHeight} -> ${row.width}x${row.height} ${row.bytes}B q${row.quality}`);
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        const row = {
          recipeId: recipe.id,
          recipeName: recipe.name,
          status: 'failed',
          reason,
          failedAt: now(),
        };
        await appendJsonl(FAILURE_PATH, row);
        await appendJsonl(MANIFEST_PATH, row);
        manifest.set(recipe.id, row);
        stats.failed += 1;
        console.error(`[FAILED] ${recipe.id} ${recipe.name}: ${reason}`);
      }
      if (DELAY_MS) await sleep(DELAY_MS);
    }
  }

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
  await ensureDirs().catch(() => {});
  await appendJsonl(FAILURE_PATH, { status: 'fatal', reason: error instanceof Error ? error.message : String(error), failedAt: now() }).catch(() => {});
  process.exit(1);
});