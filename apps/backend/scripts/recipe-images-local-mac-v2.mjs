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
const MAX_BYTES = 60 * 1024;
const MIN_BYTES = 12 * 1024;
const PAGE_SIZE = 1000;
const CONCURRENCY = Math.min(Math.max(Number(process.env.RECIPE_LOCAL_CONCURRENCY || '2'), 1), 4);
const DELAY_MS = Math.max(Number(process.env.RECIPE_LOCAL_DELAY_MS || '700'), 200);
const LIMIT = Math.max(Number(process.env.RECIPE_LOCAL_LIMIT || '0'), 0);
const START = Math.max(Number(process.env.RECIPE_LOCAL_START || '0'), 0);
const RETRY_FAILED = process.env.RECIPE_LOCAL_RETRY_FAILED !== '0';
const FORCE = process.env.RECIPE_LOCAL_FORCE === '1';
const MIRROR_EXISTING = process.env.RECIPE_LOCAL_MIRROR_EXISTING !== '0';
const SOURCE_MAPPED_FIRST = process.env.RECIPE_LOCAL_SOURCE_MAPPED_FIRST !== '0';
const GOOGLE_FALLBACK = process.env.RECIPE_LOCAL_GOOGLE_FALLBACK !== '0';
const BING_FALLBACK = process.env.RECIPE_LOCAL_BING_FALLBACK !== '0';
const RETRY_EXHAUSTED = process.env.RECIPE_LOCAL_RETRY_EXHAUSTED === '1';
const MAX_FAILURE_ATTEMPTS = 3;

const DATASET_SOURCE = 'Food Ingredients and Recipes Dataset with Images';
const DATASET_LICENSE = 'CC BY-SA 3.0';
const DATASET_URL = 'https://www.kaggle.com/datasets/pes12017000148/food-ingredients-and-recipe-dataset-with-images';
const GITHUB_MIRROR_ROOT = 'https://raw.githubusercontent.com/kaveesh-kadirvel/Fridge2Fork/main/Food%20Images/Food%20Images/';

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');

const authHeaders = { apikey: SERVICE_KEY, Accept: 'application/json' };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const now = () => new Date().toISOString();
const normalizeUrl = (url) => {
  if (!url) return null;
  let value = String(url).trim().replaceAll('&amp;', '&').replaceAll('\\u003d', '=').replaceAll('\\u0026', '&').replaceAll('\\/', '/');
  if (value.startsWith('//')) value = `https:${value}`;
  return /^https?:\/\//i.test(value) ? value : null;
};
const safeDecode = (value) => { try { return decodeURIComponent(value); } catch { return value; } };
const isGoogleThumb = (url) => /encrypted-tbn|gstatic\.com\/images\/branding|googleusercontent\.com\/static/i.test(String(url));

async function supabase(pathname, options = {}, attempts = 5) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, { ...options, headers: { ...authHeaders, ...(options.headers || {}) } });
      const text = await response.text();
      if (response.ok) return { data: text ? JSON.parse(text) : null, response };
      last = new Error(`${response.status} ${pathname}: ${text}`);
      if (response.status !== 429 && response.status < 500) break;
    } catch (error) { last = error; }
    await sleep(Math.min(15_000, 700 * 2 ** i));
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
  const { data } = await supabase('recipes?select=id,name&limit=1');
  if (!Array.isArray(data) || !data.length) throw new Error('Supabase recipe probe returned no rows.');
  return data[0];
}

function sourceFilenameCandidates(imageName) {
  const clean = path.basename(String(imageName || '').trim());
  if (!clean) return [];
  const stem = clean.replace(/\.[^.]+$/, '');
  const roots = [clean, stem, clean.startsWith('-') ? clean.slice(1) : `-${clean}`, stem.startsWith('-') ? stem.slice(1) : `-${stem}`];
  const out = [];
  const seen = new Set();
  for (const root of roots) {
    const names = /\.(jpe?g|png|webp)$/i.test(root) ? [root] : [`${root}.jpg`, `${root}.jpeg`, `${root}.png`, `${root}.webp`];
    for (const name of names) if (!seen.has(name)) { seen.add(name); out.push(name); }
  }
  return out;
}

function sourceRemoteCandidates(imageName) {
  return sourceFilenameCandidates(imageName).map((name) => `${GITHUB_MIRROR_ROOT}${name.split('/').map(encodeURIComponent).join('/')}`);
}

async function downloadBytes(url, attempts = 3) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'MYPA-recipe-image-transport/2.0', Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.7' } });
      if (response.ok) {
        const body = Buffer.from(await response.arrayBuffer());
        if (body.length) return body;
      }
      last = new Error(`Image download ${response.status}`);
      if (response.status !== 429 && response.status < 500) break;
    } catch (error) { last = error; }
    await sleep(Math.min(8000, 700 * 2 ** i));
  }
  throw last || new Error('Image download failed');
}

async function fetchSourceMappedImage(imageName) {
  let last;
  for (const url of sourceRemoteCandidates(imageName)) {
    try {
      const body = await downloadBytes(url, 2);
      const meta = await sharp(body, { failOn: 'none' }).metadata();
      if (meta.width && meta.height && meta.width >= 320 && meta.height >= 220) return { body, url, width: meta.width, height: meta.height };
      last = new Error(`Source image rejected by dimensions: ${meta.width || 0}x${meta.height || 0}`);
    } catch (error) { last = error; }
  }
  throw last || new Error(`Canonical source image not found for ${imageName}`);
}

async function compressToWebp(input) {
  const original = await sharp(input, { failOn: 'none' }).rotate().metadata();
  if (!original.width || !original.height) throw new Error('Image has no dimensions');
  if (original.width < 320 || original.height < 220) throw new Error(`Image too small: ${original.width}x${original.height}`);
  const ratio = original.width / original.height;
  if (ratio < 0.35 || ratio > 3) throw new Error(`Image aspect ratio rejected: ${ratio.toFixed(2)}`);

  let smallest;
  for (const width of [1200, 1024, 960, 880, 800, 720, 640, 576, 512, 448, 384, 320]) {
    for (const quality of [84, 78, 72, 66, 60, 54, 48, 42, 36, 30, 24]) {
      const out = await sharp(input, { failOn: 'none' }).rotate().resize({ width, fit: 'inside', withoutEnlargement: true }).webp({ quality, effort: 6 }).toBuffer();
      if (!smallest || out.length < smallest.length) smallest = out;
      if (out.length >= MIN_BYTES && out.length <= MAX_BYTES) {
        const meta = await sharp(out).metadata();
        return { out, width: meta.width || width, height: meta.height || width };
      }
    }
  }
  throw new Error(`Could not create acceptable WebP; smallest=${smallest?.length ?? 'unknown'} bytes`);
}

function googleCandidatesFromHtml(html) {
  const found = [];
  const add = (value, rank = 0) => {
    const decoded = safeDecode(String(value).replaceAll('&amp;', '&'));
    const url = normalizeUrl(decoded);
    if (!url || isGoogleThumb(url)) return;
    found.push({ url, rank });
  };
  for (const match of html.matchAll(/[?&]imgurl=([^&\"'<>]+)/gi)) add(match[1], 0);
  for (const match of html.matchAll(/data-iurl=[\"']([^\"']+)[\"']/gi)) add(match[1], 1);
  for (const match of html.matchAll(/data-original=[\"']([^\"']+)[\"']/gi)) add(match[1], 2);
  for (const match of html.matchAll(/href=[\"']([^\"']*\/imgres\?[^\"']+)[\"']/gi)) {
    try { const parsed = new URL(normalizeUrl(match[1]) || `https://www.google.com${match[1]}`); add(parsed.searchParams.get('imgurl'), -5); } catch {}
  }
  const seen = new Set();
  return found.sort((a, b) => a.rank - b.rank).map((x) => x.url).filter((url) => { const key = url.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; });
}

async function googleSearch(recipeName) {
  const query = `${recipeName} recipe finished dish`;
  for (const base of ['https://www.google.com/search?tbm=isch&hl=en&gl=us&q=', 'https://www.google.com/search?udm=2&hl=en&gl=us&q=']) {
    const searchUrl = `${base}${encodeURIComponent(query)}`;
    try {
      const response = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/140 Safari/537.36', Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9' } });
      const html = await response.text();
      if (response.ok) { const candidates = googleCandidatesFromHtml(html); if (candidates.length) return { sourceType: 'google-images', query, searchUrl, candidates }; }
    } catch {}
    await sleep(500);
  }
  throw new Error('Google Images returned no usable original candidates');
}

function bingCandidatesFromHtml(html) {
  const urls = [];
  for (const match of html.matchAll(/\"murl\"\s*:\s*\"([^\"]+)\"/g)) { const url = normalizeUrl(match[1]); if (url && !isGoogleThumb(url)) urls.push(url); }
  for (const match of html.matchAll(/murl&quot;:&quot;([^&]+?)&quot;/g)) { const url = normalizeUrl(match[1]); if (url && !isGoogleThumb(url)) urls.push(url); }
  return [...new Set(urls)];
}

async function bingSearch(recipeName) {
  const query = `${recipeName} recipe finished dish`;
  const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`;
  const response = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/140 Safari/537.36', Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' } });
  const html = await response.text();
  if (!response.ok) throw new Error(`Bing Images search ${response.status}`);
  const candidates = bingCandidatesFromHtml(html);
  if (!candidates.length) throw new Error('Bing Images returned no usable candidates');
  return { sourceType: 'bing-images', query, searchUrl, candidates };
}

async function tryWebSearchImport(recipe) {
  const searches = [];
  if (GOOGLE_FALLBACK) { try { searches.push(await googleSearch(recipe.name)); } catch {} }
  if (BING_FALLBACK) { try { searches.push(await bingSearch(recipe.name)); } catch {} }
  let last;
  for (const search of searches) {
    for (let position = 0; position < Math.min(48, search.candidates.length); position += 1) {
      const imageUrl = search.candidates[position];
      try {
        const body = await downloadBytes(imageUrl, 2);
        const compressed = await compressToWebp(body);
        return { ...compressed, sourceType: search.sourceType, sourceUrl: imageUrl, searchUrl: search.searchUrl, query: search.query, resultPosition: position + 1 };
      } catch (error) { last = error; }
    }
  }
  throw last || new Error('All web image providers exhausted');
}

async function sha256(buffer) { return crypto.createHash('sha256').update(buffer).digest('hex'); }

async function ensureDirs() {
  await Promise.all([fs.mkdir(IMAGE_ROOT, { recursive: true }), fs.mkdir(MANIFEST_DIR, { recursive: true }), fs.mkdir(LOG_DIR, { recursive: true })]);
}

async function loadLatestManifest() {
  try {
    const text = await fs.readFile(MANIFEST_PATH, 'utf8');
    const map = new Map();
    for (const line of text.split('\n')) { if (!line.trim()) continue; const row = JSON.parse(line); if (row.recipeId) map.set(String(row.recipeId), row); }
    return map;
  } catch (error) { if (error.code === 'ENOENT') return new Map(); throw error; }
}

async function appendManifest(row) { await fs.appendFile(MANIFEST_PATH, `${JSON.stringify(row)}\n`); }
async function appendFailure(row) { await fs.appendFile(path.join(LOG_DIR, 'failures.jsonl'), `${JSON.stringify(row)}\n`); }

async function mirrorExisting(recipe, relation, manifestMap) {
  const storageKey = `recipes/${recipe.id}/hero.webp`;
  const dest = path.join(IMAGE_ROOT, storageKey);
  try {
    const existing = await fs.readFile(dest); const meta = await sharp(existing).metadata();
    if (meta.format === 'webp' && existing.length >= MIN_BYTES && existing.length <= MAX_BYTES && (meta.width || 0) >= 320 && (meta.height || 0) >= 220) {
      const row = { recipeId: recipe.id, recipeName: recipe.name, status: 'present-local', sourceType: 'supabase-mirror', sourceName: relation?.source_name ?? null, sourceUrl: relation?.source_url ?? relation?.image_url ?? null, storageKey, localPath: path.relative(ROOT, dest), bytes: existing.length, width: meta.width, height: meta.height, sha256: await sha256(existing), checkedAt: now() };
      await appendManifest(row); manifestMap.set(String(recipe.id), row); return row;
    }
  } catch {}
  const sourceUrl = normalizeUrl(relation?.image_url);
  if (!sourceUrl) throw new Error('Existing hero relation has no usable image_url for mirror.');
  const body = await downloadBytes(sourceUrl, 2); const compressed = await compressToWebp(body);
  await fs.mkdir(path.dirname(dest), { recursive: true }); await fs.writeFile(dest, compressed.out);
  const row = { recipeId: recipe.id, recipeName: recipe.name, status: 'mirrored', sourceType: 'supabase-mirror', sourceName: relation?.source_name ?? null, sourceUrl: relation?.source_url ?? sourceUrl, originalUrl: sourceUrl, storageKey, localPath: path.relative(ROOT, dest), bytes: compressed.out.length, width: compressed.width, height: compressed.height, sha256: await sha256(compressed.out), checkedAt: now() };
  await appendManifest(row); manifestMap.set(String(recipe.id), row); return row;
}

async function writeCatalog(recipes) { await fs.writeFile(CATALOG_PATH, recipes.map((r) => JSON.stringify({ recipeId: r.id, name: r.name })).join('\n') + '\n'); }
async function countLocalHeroes() {
  let count = 0;
  async function walk(dir) { let entries = []; try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; } for (const entry of entries) { const full = path.join(dir, entry.name); if (entry.isDirectory()) await walk(full); else if (entry.isFile() && entry.name === 'hero.webp') count += 1; } }
  await walk(path.join(IMAGE_ROOT, 'recipes')); return count;
}

async function main() {
  await ensureDirs();
  const sample = await verifySupabase();
  const recipes = (await fetchPaged('recipes?select=id,name&order=id.asc')).filter((r) => r?.id && String(r.name || '').trim());
  const heroes = await fetchPaged('recipe_images?select=recipe_id,image_type,image_url,storage_key,source_name,source_url,source_license,source_attribution&image_type=eq.hero&order=recipe_id.asc');
  const sourceRows = await fetchPaged('recipe_source_raw?select=recipe_id,image_name&order=recipe_id.asc');
  const sourceByRecipe = new Map();
  for (const row of sourceRows) { const id = row?.recipe_id; const imageName = String(row?.image_name ?? '').trim(); if (id && imageName && imageName !== '#NAME?' && !sourceByRecipe.has(String(id))) sourceByRecipe.set(String(id), imageName); }
  await writeCatalog(recipes);
  const relationByRecipe = new Map(); for (const row of heroes) if (!relationByRecipe.has(String(row.recipe_id))) relationByRecipe.set(String(row.recipe_id), row);
  const manifestMap = await loadLatestManifest();
  const selected = recipes.slice(START, LIMIT > 0 ? START + LIMIT : undefined).filter((recipe) => FORCE || !manifestMap.get(String(recipe.id)) || !['present-local','mirrored','source-mapped-valid','imported-google-first-valid','imported-bing-fallback-valid'].includes(manifestMap.get(String(recipe.id))?.status));
  const stats = { startedAt: now(), totalRecipes: recipes.length, existingHeroRelations: heroes.length, sourceMappedRecipes: sourceByRecipe.size, localManifestBefore: manifestMap.size, selected: selected.length, skipped: 0, mirrored: 0, sourceMapped: 0, importedGoogle: 0, importedBing: 0, failed: 0, exhausted: 0, supabaseProbe: { total: null, sample } };
  console.log(JSON.stringify(stats, null, 2));

  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++; if (index >= selected.length) return;
      const recipe = selected[index]; const id = String(recipe.id); const latest = manifestMap.get(id);
      try {
        if (!FORCE && latest?.status === 'failed' && Number(latest.failureAttempt || 0) >= MAX_FAILURE_ATTEMPTS && !RETRY_EXHAUSTED) { stats.exhausted += 1; console.log(`[EXHAUSTED] ${recipe.id} ${recipe.name}`); continue; }
        const relation = relationByRecipe.get(id);
        if (relation && MIRROR_EXISTING && !FORCE) { const row = await mirrorExisting(recipe, relation, manifestMap); stats.mirrored += row.status === 'mirrored' ? 1 : 0; stats.skipped += row.status === 'present-local' ? 1 : 0; console.log(`[${row.status.toUpperCase()}] ${recipe.id} ${recipe.name}`); continue; }

        let imported = null;
        let sourceError = null;
        if (SOURCE_MAPPED_FIRST && sourceByRecipe.has(id)) {
          try {
            const imageName = sourceByRecipe.get(id); const source = await fetchSourceMappedImage(imageName); const compressed = await compressToWebp(source.body);
            const storageKey = `recipes/${recipe.id}/hero.webp`; const dest = path.join(IMAGE_ROOT, storageKey); await fs.mkdir(path.dirname(dest), { recursive: true }); await fs.writeFile(dest, compressed.out);
            imported = { ...compressed, status: 'source-mapped-valid', sourceType: 'canonical-dataset-mirror', sourceName: DATASET_SOURCE, sourceUrl: DATASET_URL, originalUrl: source.url, imageName, storageKey, localPath: path.relative(ROOT, dest), bytes: compressed.out.length, sha256: await sha256(compressed.out), license: DATASET_LICENSE, attribution: `${DATASET_SOURCE}; exact image_name=${imageName}; final-dish hero; resized/recompressed to WebP <=60KB.` };
            stats.sourceMapped += 1; console.log(`[source-mapped-valid] ${recipe.id} ${recipe.name}`);
          } catch (error) { sourceError = error; }
        }
        if (!imported) {
          imported = await tryWebSearchImport(recipe);
          imported.status = imported.sourceType === 'google-images' ? 'imported-google-first-valid' : 'imported-bing-fallback-valid';
          const storageKey = `recipes/${recipe.id}/hero.webp`; const dest = path.join(IMAGE_ROOT, storageKey); await fs.mkdir(path.dirname(dest), { recursive: true }); await fs.writeFile(dest, imported.out);
          imported.storageKey = storageKey; imported.localPath = path.relative(ROOT, dest); imported.bytes = imported.out.length; imported.sha256 = await sha256(imported.out); imported.sourceName = imported.sourceType === 'google-images' ? 'Google Images — first valid original image' : 'Bing Images — fallback after provider exhaustion';
          if (imported.status === 'imported-google-first-valid') stats.importedGoogle += 1; else stats.importedBing += 1;
          console.log(`[${imported.status}] ${recipe.id} ${recipe.name}`);
        }
        await appendManifest({ recipeId: recipe.id, recipeName: recipe.name, ...imported, importedAt: now(), sourceError: sourceError ? String(sourceError.message || sourceError) : null });
        manifestMap.set(id, { recipeId: recipe.id, status: imported.status, failureAttempt: 0 });
      } catch (error) {
        stats.failed += 1; const previous = Number(latest?.failureAttempt || 0); const row = { recipeId: recipe.id, recipeName: recipe.name, status: 'failed', failureAttempt: previous + 1, reason: error instanceof Error ? error.message : String(error), failedAt: now() }; await appendManifest(row); await appendFailure(row); manifestMap.set(id, row); console.error(`[FAILED] ${recipe.id} ${recipe.name}: ${row.reason}`);
      }
      await sleep(DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, selected.length) }, () => worker()));
  stats.finishedAt = now(); stats.localManifestAfter = manifestMap.size; stats.localHeroFiles = await countLocalHeroes(); await fs.writeFile(SUMMARY_PATH, JSON.stringify(stats, null, 2)); console.log(JSON.stringify(stats, null, 2)); if (stats.failed > 0) process.exitCode = 1;
}

main().catch(async (error) => { console.error(error); await ensureDirs().catch(() => {}); await appendFailure({ status: 'fatal', reason: error instanceof Error ? error.message : String(error), failedAt: now() }).catch(() => {}); process.exit(1); });
