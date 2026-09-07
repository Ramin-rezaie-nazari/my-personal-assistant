import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const ROOT = path.resolve(process.env.RECIPE_IMAGE_QUALITY_ROOT || './data/mypa-recipe-media-quality');
const CACHE_DIR = path.join(ROOT, 'cache');
const MANIFEST_DIR = path.join(ROOT, 'manifests');
const LOG_DIR = path.join(ROOT, 'logs');
const MANIFEST_PATH = path.join(MANIFEST_DIR, 'hero-quality-manifest.jsonl');
const SUMMARY_PATH = path.join(MANIFEST_DIR, 'summary.json');
const BUCKET = 'recipe-images';
const SUPABASE_URL = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const PAGE_SIZE = 500;
const CONCURRENCY = Math.min(Math.max(Number(process.env.RECIPE_IMAGE_QUALITY_CONCURRENCY || '3'), 1), 5);
const DELAY_MS = Math.max(Number(process.env.RECIPE_IMAGE_QUALITY_DELAY_MS || '500'), 100);
const LIMIT = Math.max(Number(process.env.RECIPE_IMAGE_QUALITY_LIMIT || '0'), 0);
const START = Math.max(Number(process.env.RECIPE_IMAGE_QUALITY_START || '0'), 0);
const FORCE = process.env.RECIPE_IMAGE_QUALITY_FORCE === '1';
const MIN_SOURCE_SIDE = 640;
const MAX_SOURCE_RATIO = 2.5;
const MAX_BYTES = 150 * 1024;
const ABSOLUTE_MAX_BYTES = 180 * 1024;
const MIN_OUTPUT_SIDE = 640;
const PAGE_TIMEOUT_MS = 25000;
const IMAGE_TIMEOUT_MS = 25000;
const MAX_PAGE_ATTEMPTS = 4;
const MAX_IMAGE_ATTEMPTS = 3;
const USER_AGENT = 'MYPA-recipe-image-quality/1.0 (+https://github.com/Ramin-rezaie-nazari/my-personal-assistant)';

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const authHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  Accept: 'application/json',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const now = () => new Date().toISOString();

async function ensureDirs() {
  await Promise.all([
    fs.mkdir(CACHE_DIR, { recursive: true }),
    fs.mkdir(MANIFEST_DIR, { recursive: true }),
    fs.mkdir(LOG_DIR, { recursive: true }),
  ]);
}

async function rest(pathname, options = {}, attempts = 5) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, {
        ...options,
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
      const text = await response.text();
      if (response.ok) return text ? JSON.parse(text) : null;
      lastError = new Error(`${response.status} ${pathname}: ${text}`);
      if (response.status !== 429 && response.status < 500) break;
    } catch (error) {
      lastError = error;
    }
    await sleep(Math.min(15000, 700 * 2 ** attempt));
  }
  throw lastError || new Error(`Supabase request failed: ${pathname}`);
}

async function fetchPaged(resource) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await rest(`${resource}&limit=${PAGE_SIZE}&offset=${offset}`);
    if (Array.isArray(page)) rows.push(...page);
    if (!Array.isArray(page) || page.length < PAGE_SIZE) return rows;
  }
}

async function appendJsonl(filePath, row) {
  await fs.appendFile(filePath, `${JSON.stringify(row)}\n`);
}

async function loadManifest() {
  try {
    const text = await fs.readFile(MANIFEST_PATH, 'utf8');
    const map = new Map();
    for (const line of text.split('\n')) {
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

function currentHeroNeedsUpgrade(row) {
  if (!row) return true;
  if (Number(row.width || 0) < 640 || Number(row.height || 0) < 480) return true;
  if (Number(row.byte_size || 0) < 20000) return true;
  return false;
}

function epicuriousSlugCandidates(recipe, imageName) {
  const raw = String(imageName || '').trim();
  const recipeSlug = String(recipe.name || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const variants = [
    raw.replace(/^[-_]+/, ''),
    raw,
    recipeSlug,
  ].filter(Boolean);
  const urls = [];
  const seen = new Set();
  for (const slug of variants) {
    const url = `https://www.epicurious.com/recipes/food/views/${encodeURIComponent(slug)}`;
    if (!seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }
  return urls;
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
  if (!/^https?:\/\//i.test(url)) return null;
  return url;
}

function decodeSafe(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function extractEpicuriousPageCandidates(html) {
  const found = [];
  const add = (value, rank, source) => {
    const url = normalizeUrl(decodeSafe(String(value).replaceAll('&amp;', '&')));
    if (!url) return;
    const lower = url.toLowerCase();
    const isEpicuriousAsset = lower.includes('assets.epicurious.com');
    const isLikelyImage = /\.(?:jpe?g|png|webp)(?:[?#]|$)/i.test(url) || isEpicuriousAsset;
    if (!isLikelyImage) return;
    found.push({ url, rank, source });
  };

  for (const match of html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]+content=["']([^"']+)["'][^>]*>/gi)) {
    add(match[1], -10, 'meta');
  }
  for (const match of html.matchAll(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]*>/gi)) {
    add(match[1], -10, 'meta');
  }
  for (const match of html.matchAll(/(?:src|data-src|data-original)=["']([^"']+)["']/gi)) {
    add(match[1], 10, 'img-src');
  }
  for (const match of html.matchAll(/srcset=["']([^"']+)["']/gi)) {
    for (const part of match[1].split(',')) {
      const pieces = part.trim().split(/\s+/);
      if (pieces[0]) add(pieces[0], 5, 'srcset');
    }
  }
  for (const match of html.matchAll(/https?:\\?\/\\?\/assets\.epicurious\.com\/[^"'\\\s<>\\]+/gi)) {
    add(match[0].replaceAll('\\/', '/'), 0, 'asset-regex');
  }

  const seen = new Set();
  return found
    .map((candidate) => {
      const lower = candidate.url.toLowerCase();
      let score = candidate.rank;
      if (lower.includes('assets.epicurious.com')) score -= 5;
      if (lower.includes('/master/')) score -= 8;
      const widthMatch = lower.match(/(?:w_|width=|[?&]w=)(\d{3,4})/);
      if (widthMatch) score -= Math.min(Number(widthMatch[1]) / 500, 6);
      return { ...candidate, score };
    })
    .sort((a, b) => a.score - b.score)
    .filter((candidate) => {
      const key = candidate.url.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPage(url) {
  let lastError;
  for (let attempt = 0; attempt < MAX_PAGE_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, {
        redirect: 'follow',
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      }, PAGE_TIMEOUT_MS);
      const html = await response.text();
      if (response.ok && html.length > 1000) return { html, finalUrl: response.url || url, status: response.status };
      lastError = new Error(`Recipe page ${response.status}: ${url}`);
      if (response.status !== 429 && response.status < 500) break;
    } catch (error) {
      lastError = error;
    }
    await sleep(Math.min(12000, 700 * 2 ** attempt));
  }
  throw lastError || new Error(`Recipe page unavailable: ${url}`);
}

function sourceMetadata(body) {
  return sharp(body, { failOn: 'none' }).metadata().then((meta) => {
    const width = Number(meta.width || 0);
    const height = Number(meta.height || 0);
    if (!width || !height) throw new Error('Source image has no dimensions');
    if (Math.min(width, height) < MIN_SOURCE_SIDE) throw new Error(`Source image too small: ${width}x${height}`);
    const ratio = width / height;
    if (ratio < 1 / MAX_SOURCE_RATIO || ratio > MAX_SOURCE_RATIO) throw new Error(`Source image aspect ratio rejected: ${ratio.toFixed(2)}`);
    return { width, height, format: meta.format || 'unknown' };
  });
}

async function downloadImage(url) {
  let lastError;
  for (let attempt = 0; attempt < MAX_IMAGE_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, {
        redirect: 'follow',
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      }, IMAGE_TIMEOUT_MS);
      if (response.ok) {
        const body = Buffer.from(await response.arrayBuffer());
        if (body.length > 5000) return body;
      }
      lastError = new Error(`Image download ${response.status}: ${url}`);
      if (response.status !== 429 && response.status < 500) break;
    } catch (error) {
      lastError = error;
    }
    await sleep(Math.min(9000, 700 * 2 ** attempt));
  }
  throw lastError || new Error(`Image download failed: ${url}`);
}

async function searchEpicurious(name) {
  const query = `site:epicurious.com/recipes/food/views ${name}`;
  const urls = [];
  const engines = [
    `https://www.google.com/search?hl=en&gl=us&q=${encodeURIComponent(query)}`,
    `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
  ];
  for (const searchUrl of engines) {
    try {
      const response = await fetchWithTimeout(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/140 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        },
      }, PAGE_TIMEOUT_MS);
      const html = await response.text();
      if (!response.ok) continue;
      for (const match of html.matchAll(/https?:\/\/www\.epicurious\.com\/recipes\/food\/views\/[A-Za-z0-9_%\-]+/gi)) urls.push(match[0].replace(/[.,)]+$/, ''));
    } catch {}
    if (urls.length) break;
  }
  return [...new Set(urls)].slice(0, 5);
}

async function resolveRecipeImage(recipe, imageName) {
  const pageUrls = epicuriousSlugCandidates(recipe, imageName);
  const searched = new Set();
  let lastError;
  for (const candidatePage of [...pageUrls, ...(await searchEpicurious(recipe.name))]) {
    if (searched.has(candidatePage)) continue;
    searched.add(candidatePage);
    try {
      const page = await fetchPage(candidatePage);
      const candidates = extractEpicuriousPageCandidates(page.html).slice(0, 20);
      let candidateError;
      for (const candidate of candidates) {
        try {
          const body = await downloadImage(candidate.url);
          const meta = await sourceMetadata(body);
          return {
            body,
            recipePageUrl: page.finalUrl,
            imageUrl: candidate.url,
            sourceExtractor: candidate.source,
            sourceWidth: meta.width,
            sourceHeight: meta.height,
          };
        } catch (error) {
          candidateError = error;
        }
      }
      lastError = candidateError || new Error(`No usable image candidates: ${candidatePage}`);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error(`Could not resolve Epicurious image for ${recipe.name}`);
}

async function encodeQualityVariants(input) {
  const widths = [1200, 1080, 960, 880, 800, 720, 640];
  const qualities = [92, 88, 85, 82, 79, 76, 73, 70, 67];
  let best = null;
  for (const width of widths) {
    for (const quality of qualities) {
      const output = await sharp(input, { failOn: 'none' })
        .rotate()
        .resize({ width, fit: 'inside', withoutEnlargement: true })
        .webp({ quality, effort: 6 })
        .toBuffer();
      const meta = await sharp(output, { failOn: 'none' }).metadata();
      const result = {
        output,
        width: Number(meta.width || width),
        height: Number(meta.height || width),
        bytes: output.length,
        quality,
      };
      if (!best || result.bytes > best.bytes) best = result;
      if (result.bytes <= MAX_BYTES && result.width >= MIN_OUTPUT_SIDE && result.height >= MIN_OUTPUT_SIDE / MAX_SOURCE_RATIO) {
        return result;
      }
    }
  }
  if (best && best.bytes <= ABSOLUTE_MAX_BYTES) return best;
  throw new Error(`Could not create acceptable WebP; best=${best?.bytes ?? 'unknown'} bytes`);
}

async function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function uploadStorage(key, body) {
  const encoded = key.split('/').map(encodeURIComponent).join('/');
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      const response = await fetchWithTimeout(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encoded}`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'image/webp',
          'Cache-Control': '31536000, immutable',
          'x-upsert': 'true',
        },
        body,
      }, IMAGE_TIMEOUT_MS);
      const text = await response.text();
      if (response.ok) return;
      if (response.status !== 429 && response.status < 500) throw new Error(`Storage upload ${response.status}: ${text}`);
    } catch (error) {
      if (attempt === 5) throw error;
    }
    await sleep(Math.min(15000, 1200 * 2 ** attempt));
  }
  throw new Error(`Storage upload failed: ${key}`);
}

async function upsertRecipeImage(recipe, packed, source) {
  const key = `recipes/${recipe.id}/hero.webp`;
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`;
  await uploadStorage(key, packed.output);
  try {
    await rest('recipe_images', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        recipe_id: recipe.id,
        image_type: 'hero',
        step_number: null,
        image_url: publicUrl,
        width: packed.width,
        height: packed.height,
        byte_size: packed.bytes,
        mime_type: 'image/webp',
        alt_text: recipe.name,
        sort_order: 0,
        storage_key: key,
        source_name: 'Epicurious recipe page',
        source_url: source.recipePageUrl,
        source_license: 'Source page; verify production rights per source policy',
        source_attribution: `Epicurious recipe page matched by image_name/title; image=${source.imageUrl}; original=${source.sourceWidth}x${source.sourceHeight}; final-dish hero; WebP quality=${packed.quality}; max target=${MAX_BYTES} bytes.`,
      }),
    });
  } catch (error) {
    try {
      await fetchWithTimeout(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`, { method: 'DELETE', headers: authHeaders }, IMAGE_TIMEOUT_MS);
    } catch {}
    throw error;
  }
  return { key, publicUrl };
}

async function loadExistingHeroes() {
  return fetchPaged('recipe_images?select=recipe_id,image_type,width,height,byte_size,storage_key,source_url&image_type=eq.hero&order=recipe_id.asc');
}

async function main() {
  await ensureDirs();
  const [recipes, sourceRows, heroes] = await Promise.all([
    fetchPaged('recipes?select=id,name&order=id.asc'),
    fetchPaged('recipe_source_raw?select=recipe_id,image_name&order=recipe_id.asc'),
    loadExistingHeroes(),
  ]);

  const sourceByRecipe = new Map();
  for (const row of sourceRows) {
    const id = String(row?.recipe_id || '');
    const imageName = String(row?.image_name || '').trim();
    if (id && imageName && imageName !== '#NAME?' && !sourceByRecipe.has(id)) sourceByRecipe.set(id, imageName);
  }

  const heroByRecipe = new Map();
  for (const row of heroes) if (!heroByRecipe.has(String(row.recipe_id))) heroByRecipe.set(String(row.recipe_id), row);

  const manifest = await loadManifest();
  const eligible = recipes.filter((recipe) => {
    const current = heroByRecipe.get(String(recipe.id));
    const previous = manifest.get(String(recipe.id));
    if (!FORCE && current && !currentHeroNeedsUpgrade(current)) return false;
    if (!FORCE && previous?.status === 'upgraded') return false;
    return true;
  });
  const work = eligible.slice(START, LIMIT > 0 ? START + LIMIT : undefined);

  const stats = {
    startedAt: now(),
    totalRecipes: recipes.length,
    existingHeroRelations: heroes.length,
    sourceMappedRecipes: sourceByRecipe.size,
    sourceUnmappedRecipes: recipes.length - sourceByRecipe.size,
    weakOrMissingHeroes: eligible.length,
    selected: work.length,
    concurrency: CONCURRENCY,
    delayMs: DELAY_MS,
    targetBytes: MAX_BYTES,
    completed: 0,
    upgraded: 0,
    failed: 0,
    skipped: recipes.length - eligible.length,
    bytes: [],
    sourceWidth: [],
    sourceHeight: [],
  };
  console.log(JSON.stringify(stats, null, 2));

  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= work.length) return;
      const recipe = work[index];
      const id = String(recipe.id);
      try {
        const imageName = sourceByRecipe.get(id) || '';
        const source = await resolveRecipeImage(recipe, imageName);
        const packed = await encodeQualityVariants(source.body);
        const uploaded = await upsertRecipeImage(recipe, packed, source);
        const row = {
          recipeId: recipe.id,
          recipeName: recipe.name,
          status: 'upgraded',
          sourceType: 'epicurious-page',
          sourcePageUrl: source.recipePageUrl,
          sourceImageUrl: source.imageUrl,
          sourceExtractor: source.sourceExtractor,
          sourceWidth: source.sourceWidth,
          sourceHeight: source.sourceHeight,
          storageKey: uploaded.key,
          publicUrl: uploaded.publicUrl,
          width: packed.width,
          height: packed.height,
          bytes: packed.bytes,
          quality: packed.quality,
          sha256: await sha256(packed.output),
          imageName: imageName || null,
          completedAt: now(),
        };
        await appendJsonl(MANIFEST_PATH, row);
        manifest.set(id, row);
        stats.completed += 1;
        stats.upgraded += 1;
        stats.bytes.push(packed.bytes);
        stats.sourceWidth.push(source.sourceWidth);
        stats.sourceHeight.push(source.sourceHeight);
        console.log(`[UPGRADED] ${recipe.id} ${recipe.name} ${source.sourceWidth}x${source.sourceHeight} -> ${packed.width}x${packed.height} ${packed.bytes}B`);
      } catch (error) {
        const row = {
          recipeId: recipe.id,
          recipeName: recipe.name,
          status: 'failed',
          imageName: sourceByRecipe.get(id) || null,
          reason: error instanceof Error ? error.message : String(error),
          failedAt: now(),
        };
        await appendJsonl(MANIFEST_PATH, row);
        await appendJsonl(path.join(LOG_DIR, 'failures.jsonl'), row);
        stats.failed += 1;
        console.error(`[FAILED] ${recipe.id} ${recipe.name}: ${row.reason}`);
      }
      await sleep(DELAY_MS);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, work.length) }, () => worker()));
  const sortedBytes = [...stats.bytes].sort((a, b) => a - b);
  stats.finishedAt = now();
  stats.completed = stats.upgraded + stats.failed;
  stats.minBytes = sortedBytes[0] || null;
  stats.medianBytes = sortedBytes.length ? sortedBytes[Math.floor(sortedBytes.length / 2)] : null;
  stats.maxBytes = sortedBytes[sortedBytes.length - 1] || null;
  stats.status = stats.failed === 0 ? 'complete' : 'incomplete';
  await fs.writeFile(SUMMARY_PATH, JSON.stringify(stats, null, 2));
  console.log(JSON.stringify(stats, null, 2));
  if (stats.failed > 0) process.exitCode = 1;
}

main().catch(async (error) => {
  console.error(error);
  await ensureDirs().catch(() => {});
  await appendJsonl(path.join(LOG_DIR, 'failures.jsonl'), { status: 'fatal', reason: error instanceof Error ? error.message : String(error), failedAt: now() }).catch(() => {});
  process.exit(1);
});
