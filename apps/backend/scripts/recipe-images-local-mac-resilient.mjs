import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const ROOT = path.resolve(process.env.RECIPE_LOCAL_ROOT || './data/mypa-recipe-media');
const IMAGE_ROOT = path.join(ROOT, 'images');
const MANIFEST_DIR = path.join(ROOT, 'manifests');
const LOG_DIR = path.join(ROOT, 'logs');
const MANIFEST_PATH = path.join(MANIFEST_DIR, 'recipe-hero-manifest.jsonl');
const SUMMARY_PATH = path.join(MANIFEST_DIR, 'summary.json');
const CATALOG_PATH = path.join(ROOT, 'recipe-catalog.jsonl');

const SUPABASE_URL = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const BUCKET = 'recipe-images';
const MAX_BYTES = 150 * 1024;
const MIN_BYTES = 12 * 1024;
const PAGE_SIZE = 1000;
const CONCURRENCY = Math.min(Math.max(Number(process.env.RECIPE_LOCAL_CONCURRENCY || '2'), 1), 4);
const DELAY_MS = Math.max(Number(process.env.RECIPE_LOCAL_DELAY_MS || '1500'), 300);
const LIMIT = Math.max(Number(process.env.RECIPE_LOCAL_LIMIT || '0'), 0);
const START = Math.max(Number(process.env.RECIPE_LOCAL_START || '0'), 0);
const RETRY_FAILED = process.env.RECIPE_LOCAL_RETRY_FAILED !== '0';
const FORCE = process.env.RECIPE_LOCAL_FORCE === '1';
const MIRROR_EXISTING = process.env.RECIPE_LOCAL_MIRROR_EXISTING !== '0';
const GOOGLE_MISSING = process.env.RECIPE_LOCAL_GOOGLE_MISSING !== '0';
const BING_FALLBACK = process.env.RECIPE_LOCAL_BING_FALLBACK !== '0';
const RETRY_EXHAUSTED = process.env.RECIPE_LOCAL_RETRY_EXHAUSTED === '1';
const MAX_FAILURE_ATTEMPTS = Math.min(Math.max(Number(process.env.RECIPE_LOCAL_MAX_FAILURE_ATTEMPTS || '3'), 1), 10);

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');

const authHeaders = {
  apikey: SERVICE_KEY,
  Accept: 'application/json',
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const now = () => new Date().toISOString();

async function ensureDirs() {
  await Promise.all([
    fs.mkdir(IMAGE_ROOT, { recursive: true }),
    fs.mkdir(MANIFEST_DIR, { recursive: true }),
    fs.mkdir(LOG_DIR, { recursive: true }),
  ]);
}

async function supabase(pathname, attempts = 5) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, {
        headers: authHeaders,
      });
      const text = await response.text();
      if (response.ok) return { data: text ? JSON.parse(text) : null, response };
      last = new Error(`${response.status} ${pathname}: ${text}`);
      if (response.status !== 429 && response.status < 500) break;
    } catch (error) { last = error; }
    await sleep(Math.min(20_000, 1000 * 2 ** i));
  }
  throw last || new Error(`Supabase request failed: ${pathname}`);
}

async function fetchPaged(resource) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const result = await supabase(`${resource}&limit=${PAGE_SIZE}&offset=${offset}`);
    const page = Array.isArray(result.data) ? result.data : [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

async function verifySupabase() {
  const { data, response } = await supabase('recipes?select=id,name&order=id.asc&limit=1');
  if (!Array.isArray(data) || !data.length) throw new Error(`Supabase recipe probe returned no rows. HTTP=${response.status}`);
  return { total: Number((response.headers.get('content-range') || '').match(/\/(\d+)$/)?.[1] || 0), sample: data[0] };
}

function normalizeUrl(url) {
  if (!url) return null;
  let value = String(url).trim().replaceAll('\\u003d', '=').replaceAll('\\u0026', '&').replaceAll('\\/', '/');
  if (value.startsWith('//')) value = `https:${value}`;
  return /^https?:\/\//i.test(value) ? value : null;
}

function isGoogleThumb(url) {
  const lower = String(url).toLowerCase();
  return lower.includes('encrypted-tbn') || lower.includes('gstatic.com/images/branding') || lower.includes('googleusercontent.com/static');
}

function scoreImageUrl(url) {
  const lower = url.toLowerCase();
  let score = 50;
  if (isGoogleThumb(url)) score += 1000;
  if (/\.(jpe?g|png|webp|avif)(\?|#|$)/i.test(url)) score -= 30;
  if (/\b(image|photo|food|recipe|media|upload|cdn)\b/i.test(lower)) score -= 10;
  if (lower.includes('google.com')) score += 200;
  return score;
}

function decodeURIComponentSafe(value) {
  try { return decodeURIComponent(value); } catch { return value; }
}

function extractGoogleCandidates(html) {
  const found = [];
  const add = (value, rank = 0) => {
    const url = normalizeUrl(decodeURIComponentSafe(String(value).replaceAll('&amp;', '&')));
    if (!url) return;
    found.push({ url, rank: rank + scoreImageUrl(url) });
  };

  const patterns = [
    /[?&]imgurl=([^&\"'<>]+)/gi,
    /[?&]url=([^&\"'<>]+)/gi,
    /data-iurl=[\"']([^\"']+)[\"']/gi,
    /data-original=[\"']([^\"']+)[\"']/gi,
  ];
  for (const regex of patterns) for (const match of html.matchAll(regex)) add(match[1], 0);

  for (const match of html.matchAll(/href=[\"']([^\"']*\/imgres\?[^\"']+)[\"']/gi)) {
    try {
      const parsed = new URL(normalizeUrl(match[1]) || `https://www.google.com${match[1]}`);
      add(parsed.searchParams.get('imgurl'), -50);
    } catch {}
  }

  for (const match of html.matchAll(/\"ou\"\s*:\s*\"((?:\\.|[^\"\\])+)\"/g)) {
    let value = match[1];
    try { value = JSON.parse(`\"${value.replace(/\"/g, '\\\"')}\"`); } catch {}
    add(value, -20);
  }

  const seen = new Set();
  return found.sort((a, b) => a.rank - b.rank).map((x) => x.url).filter((url) => {
    const key = url.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return !isGoogleThumb(url);
  });
}

async function googleCandidates(recipeName) {
  const query = `${recipeName} recipe`;
  for (const base of [
    'https://www.google.com/search?tbm=isch&hl=en&gl=us&q=',
    'https://www.google.com/search?udm=2&hl=en&gl=us&q=',
  ]) {
    const searchUrl = `${base}${encodeURIComponent(query)}`;
    try {
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/140 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      const html = await response.text();
      if (response.ok) {
        const candidates = extractGoogleCandidates(html);
        if (candidates.length) return { sourceType: 'google-images', query, searchUrl, candidates };
      }
    } catch {}
    await sleep(800);
  }
  throw new Error('No usable original-image candidates from Google Images');
}

function extractBingCandidates(html) {
  const urls = [];
  for (const match of html.matchAll(/\"murl\"\s*:\s*\"([^\"]+)\"/g)) urls.push(normalizeUrl(match[1]));
  for (const match of html.matchAll(/murl&quot;:&quot;([^&]+?)&quot;/g)) urls.push(normalizeUrl(match[1]));
  return [...new Set(urls.filter(Boolean))].filter((url) => !isGoogleThumb(url));
}

async function bingCandidates(recipeName) {
  const query = `${recipeName} recipe`;
  const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`;
  const response = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/140 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });
  const html = await response.text();
  if (!response.ok) throw new Error(`Bing Images search ${response.status}`);
  const candidates = extractBingCandidates(html);
  if (!candidates.length) throw new Error('No usable candidates from Bing Images');
  return { sourceType: 'bing-images-fallback', query, searchUrl, candidates };
}

async function downloadBytes(url) {
  let last;
  for (let i = 0; i < 3; i += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 MYPA recipe image importer', Accept: 'image/*,*/*;q=0.7' },
      });
      if (response.ok) {
        const body = Buffer.from(await response.arrayBuffer());
        if (body.length) return body;
      }
      last = new Error(`Image download ${response.status}`);
    } catch (error) { last = error; }
    await sleep(Math.min(10_000, 800 * 2 ** i));
  }
  throw last || new Error('Image download failed');
}

async function validateAndCompress(input) {
  const meta = await sharp(input, { failOn: 'none' }).rotate().metadata();
  if (!meta.width || !meta.height) throw new Error('Image has no dimensions');
  if (meta.width < 320 || meta.height < 220) throw new Error(`Image too small: ${meta.width}x${meta.height}`);
  const ratio = meta.width / meta.height;
  if (ratio < 0.35 || ratio > 3) throw new Error(`Image aspect ratio rejected: ${ratio.toFixed(2)}`);

  let smallest = null;
  for (const width of [1200, 1024, 960, 880, 800, 720, 640, 576, 512, 448, 384, 320]) {
    for (const quality of [84, 80, 76, 72, 68, 64, 60, 56, 52, 48, 44, 40, 36, 32, 28]) {
      const out = await sharp(input, { failOn: 'none' }).rotate().resize({ width, fit: 'inside', withoutEnlargement: true }).webp({ quality, effort: 6 }).toBuffer();
      if (!smallest || out.length < smallest.length) smallest = out;
      if (out.length >= MIN_BYTES && out.length <= MAX_BYTES) {
        const finalMeta = await sharp(out).metadata();
        return { out, width: finalMeta.width || width, height: finalMeta.height || width };
      }
    }
  }
  throw new Error(`Could not create acceptable WebP; smallest=${smallest?.length ?? 'unknown'} bytes`);
}

async function sha256(buffer) { return crypto.createHash('sha256').update(buffer).digest('hex'); }

async function loadLatestManifest() {
  try {
    const text = await fs.readFile(MANIFEST_PATH, 'utf8');
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

async function appendManifest(row) { await fs.appendFile(MANIFEST_PATH, `${JSON.stringify(row)}\n`); }
async function appendFailure(row) { await fs.appendFile(path.join(LOG_DIR, 'failures.jsonl'), `${JSON.stringify(row)}\n`); }

function publicStorageUrl(key) {
  if (!key) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${String(key).split('/').map(encodeURIComponent).join('/')}`;
}

async function writeCatalog(recipes) {
  await fs.writeFile(CATALOG_PATH, recipes.map((r) => JSON.stringify({ recipeId: r.id, name: r.name })).join('\n') + '\n');
}

async function mirrorExisting(recipe, relation, manifestMap) {
  const storageKey = `recipes/${recipe.id}/hero.webp`;
  const dest = path.join(IMAGE_ROOT, storageKey);
  try {
    const existing = await fs.readFile(dest);
    const meta = await sharp(existing).metadata();
    if (meta.format === 'webp' && existing.length >= MIN_BYTES && existing.length <= MAX_BYTES && meta.width >= 320 && meta.height >= 220) {
      const row = { recipeId: recipe.id, recipeName: recipe.name, status: 'present-local', sourceType: 'supabase-mirror', sourceName: relation?.source_name ?? null, sourceUrl: relation?.source_url ?? null, storageKey, localPath: path.relative(ROOT, dest), bytes: existing.length, width: meta.width, height: meta.height, sha256: await sha256(existing), checkedAt: now() };
      await appendManifest(row); manifestMap.set(String(recipe.id), row); return row;
    }
  } catch {}

  const sourceUrl = normalizeUrl(relation?.image_url) || publicStorageUrl(relation?.storage_key || storageKey);
  if (!sourceUrl) throw new Error('Existing hero has no usable image_url/storage_key');
  const input = await downloadBytes(sourceUrl);
  const compressed = await validateAndCompress(input);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, compressed.out);
  const row = { recipeId: recipe.id, recipeName: recipe.name, status: 'mirrored', sourceType: 'supabase-mirror', sourceName: relation?.source_name ?? null, sourceUrl: relation?.source_url ?? sourceUrl, originalUrl: sourceUrl, storageKey, localPath: path.relative(ROOT, dest), bytes: compressed.out.length, width: compressed.width, height: compressed.height, sha256: await sha256(compressed.out), checkedAt: now() };
  await appendManifest(row); manifestMap.set(String(recipe.id), row); return row;
}

async function trySearchAndImport(recipe, search, manifestMap) {
  let pos = 0;
  let last;
  for (const imageUrl of search.candidates.slice(0, 48)) {
    pos += 1;
    try {
      const input = await downloadBytes(imageUrl);
      const compressed = await validateAndCompress(input);
      const storageKey = `recipes/${recipe.id}/hero.webp`;
      const dest = path.join(IMAGE_ROOT, storageKey);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.writeFile(dest, compressed.out);
      const sourceStatus = search.sourceType === 'google-images' ? 'imported-google-first-valid' : 'imported-bing-fallback-valid';
      const row = { recipeId: recipe.id, recipeName: recipe.name, status: sourceStatus, sourceType: search.sourceType, sourceName: search.sourceType === 'google-images' ? 'Google Images — first valid original image' : 'Bing Images — fallback after Google candidate exhaustion', sourceUrl: imageUrl, searchUrl: search.searchUrl, query: search.query, resultPosition: pos, storageKey, localPath: path.relative(ROOT, dest), bytes: compressed.out.length, width: compressed.width, height: compressed.height, sha256: await sha256(compressed.out), importedAt: now() };
      await appendManifest(row); manifestMap.set(String(recipe.id), row); return row;
    } catch (error) { last = error; }
  }
  throw last || new Error(`All ${search.sourceType} candidates failed`);
}

async function importMissing(recipe, manifestMap) {
  const latest = manifestMap.get(String(recipe.id));
  if (!FORCE && latest && ['present-local', 'mirrored', 'imported-google-first-valid', 'imported-bing-fallback-valid'].includes(latest.status)) return { status: 'skipped-valid-local' };
  if (!RETRY_FAILED && latest?.status === 'failed') return { status: 'skipped-failed' };
  const previousFailures = Number(latest?.failureAttempt || 0);
  if (!FORCE && latest?.status === 'failed' && previousFailures >= MAX_FAILURE_ATTEMPTS && !RETRY_EXHAUSTED) return { status: 'skipped-exhausted' };

  let googleSearch;
  try {
    googleSearch = await googleCandidates(recipe.name);
  } catch (googleError) {
    if (!BING_FALLBACK) throw googleError;
    return trySearchAndImport(recipe, await bingCandidates(recipe.name), manifestMap);
  }

  try {
    return await trySearchAndImport(recipe, googleSearch, manifestMap);
  } catch (googleCandidatesError) {
    if (!BING_FALLBACK) throw googleCandidatesError;
    try {
      return await trySearchAndImport(recipe, await bingCandidates(recipe.name), manifestMap);
    } catch (bingError) {
      const error = new Error(`Google exhausted candidates (${googleCandidatesError.message}); Bing exhausted candidates (${bingError.message})`);
      error.cause = bingError;
      throw error;
    }
  }
}

async function fetchData() {
  const probe = await verifySupabase();
  const recipes = (await fetchPaged('recipes?select=id,name&order=id.asc')).filter((r) => r?.id && String(r.name || '').trim());
  const heroes = await fetchPaged('recipe_images?select=recipe_id,image_type,image_url,storage_key,source_name,source_url,source_license,source_attribution&image_type=eq.hero&order=recipe_id.asc');
  return { probe, recipes, heroes };
}

async function main() {
  await ensureDirs();
  const { probe, recipes, heroes } = await fetchData();
  await writeCatalog(recipes);
  const relationByRecipe = new Map();
  for (const row of heroes) if (!relationByRecipe.has(String(row.recipe_id))) relationByRecipe.set(String(row.recipe_id), row);
  const manifestMap = await loadLatestManifest();
  const selected = recipes.slice(START, LIMIT > 0 ? START + LIMIT : undefined);
  const stats = { startedAt: now(), totalRecipes: recipes.length, existingHeroRelations: heroes.length, localManifestBefore: manifestMap.size, selected: selected.length, mirrored: 0, importedGoogle: 0, importedBing: 0, skipped: 0, failed: 0, exhausted: 0, supabaseProbe: probe };
  console.log(JSON.stringify(stats, null, 2));

  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= selected.length) return;
      const recipe = selected[index];
      const relation = relationByRecipe.get(String(recipe.id));
      try {
        const local = manifestMap.get(String(recipe.id));
        const usableLocal = Boolean(local && ['present-local', 'mirrored', 'imported-google-first-valid', 'imported-bing-fallback-valid'].includes(local.status));
        if (usableLocal && !FORCE) { stats.skipped += 1; console.log(`[SKIP] ${recipe.id} ${recipe.name}`); }
        else if (relation && MIRROR_EXISTING) {
          const row = await mirrorExisting(recipe, relation, manifestMap);
          stats.mirrored += row.status === 'mirrored' ? 1 : 0;
          stats.skipped += row.status === 'present-local' ? 1 : 0;
          console.log(`[MIRROR] ${recipe.id} ${recipe.name}`);
        } else if (GOOGLE_MISSING) {
          const row = await importMissing(recipe, manifestMap);
          if (row.status === 'imported-google-first-valid') stats.importedGoogle += 1;
          else if (row.status === 'imported-bing-fallback-valid') stats.importedBing += 1;
          else if (row.status === 'skipped-exhausted') stats.exhausted += 1;
          else stats.skipped += 1;
          console.log(`[${row.status}] ${recipe.id} ${recipe.name}`);
        } else { stats.skipped += 1; }
      } catch (error) {
        stats.failed += 1;
        const previous = manifestMap.get(String(recipe.id));
        const failureAttempt = Number(previous?.failureAttempt || 0) + 1;
        const row = { recipeId: recipe.id, recipeName: recipe.name, status: 'failed', failureAttempt, reason: error instanceof Error ? error.message : String(error), sourceType: relation ? 'supabase-mirror' : 'google-images', failedAt: now() };
        await appendManifest(row); await appendFailure(row);
        console.error(`[FAILED] ${recipe.id} ${recipe.name}: ${row.reason}`);
      }
      await sleep(DELAY_MS);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, selected.length) }, () => worker()));
  stats.finishedAt = now();
  stats.localManifestAfter = manifestMap.size;
  stats.localHeroFiles = await countLocalHeroes();
  await fs.writeFile(SUMMARY_PATH, JSON.stringify(stats, null, 2));
  console.log(JSON.stringify(stats, null, 2));
  if (stats.failed > 0) process.exitCode = 1;
}

async function countLocalHeroes() {
  let count = 0;
  async function walk(dir) {
    let entries = [];
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else if (entry.isFile() && entry.name === 'hero.webp') count += 1;
    }
  }
  await walk(path.join(IMAGE_ROOT, 'recipes'));
  return count;
}

main().catch(async (error) => {
  console.error(error);
  await ensureDirs().catch(() => {});
  await appendFailure({ status: 'fatal', reason: error instanceof Error ? error.message : String(error), failedAt: now() }).catch(() => {});
  process.exit(1);
});
