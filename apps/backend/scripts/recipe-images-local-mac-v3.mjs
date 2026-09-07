import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
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
const MIRROR_EXISTING = process.env.RECIPE_LOCAL_MIRROR_EXISTING !== '0';
const SOURCE_MAPPED_FIRST = process.env.RECIPE_LOCAL_SOURCE_MAPPED_FIRST !== '0';
const GOOGLE_FALLBACK = process.env.RECIPE_LOCAL_GOOGLE_FALLBACK !== '0';
const BING_FALLBACK = process.env.RECIPE_LOCAL_BING_FALLBACK !== '0';
const AUTO_DOWNLOAD_DATASET = process.env.RECIPE_LOCAL_AUTO_DOWNLOAD_DATASET !== '0';
const DATASET_DIR = process.env.RECIPE_LOCAL_DATASET_DIR?.trim() || '';
const MAX_FAILURE_ATTEMPTS = 3;

const DATASET_SLUG = 'pes12017000148/food-ingredients-and-recipe-dataset-with-images';
const DATASET_URL = `https://www.kaggle.com/datasets/${DATASET_SLUG}`;
const DATASET_LICENSE = 'CC BY-SA 3.0';
const GITHUB_MIRROR_ROOT = 'https://raw.githubusercontent.com/kaveesh-kadirvel/Fridge2Fork/main/Food%20Images/Food%20Images/';

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
const authHeaders = { apikey: SERVICE_KEY, Accept: 'application/json' };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const now = () => new Date().toISOString();

async function supabase(pathname, options = {}, attempts = 5) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, {
        ...options,
        headers: { ...authHeaders, ...(options.headers || {}) },
      });
      const text = await response.text();
      if (response.ok) return { data: text ? JSON.parse(text) : null, response };
      last = new Error(`${response.status} ${pathname}: ${text}`);
      if (response.status !== 429 && response.status < 500) break;
    } catch (error) { last = error; }
    await sleep(Math.min(15000, 700 * 2 ** i));
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

async function ensureDirs() {
  await Promise.all([
    fs.mkdir(IMAGE_ROOT, { recursive: true }),
    fs.mkdir(MANIFEST_DIR, { recursive: true }),
    fs.mkdir(LOG_DIR, { recursive: true }),
  ]);
}

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

async function appendManifest(row) {
  await fs.appendFile(MANIFEST_PATH, `${JSON.stringify(row)}\n`);
}

async function appendFailure(row) {
  await fs.appendFile(path.join(LOG_DIR, 'failures.jsonl'), `${JSON.stringify(row)}\n`);
}

function publicStorageUrl(key) {
  if (!key) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${String(key).split('/').map(encodeURIComponent).join('/')}`;
}

function cleanFilename(value) {
  return path.basename(String(value || '').trim());
}

function candidateNames(imageName) {
  const clean = cleanFilename(imageName);
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

function discoverDatasetRoot() {
  if (DATASET_DIR) return path.resolve(DATASET_DIR);
  const candidates = [
    path.join(process.cwd(), 'recipe-image-dataset'),
    path.join(process.cwd(), 'archive'),
    path.join(process.cwd(), 'Food Images'),
    path.join(process.env.HOME || '', 'recipe-image-dataset'),
    path.join(process.env.HOME || '', 'Food Images'),
    path.join(process.env.HOME || '', '.cache', 'kagglehub'),
  ];
  for (const candidate of candidates) {
    try { if (candidate && fsSyncExists(candidate)) return candidate; } catch {}
  }
  return null;
}

function fsSyncExists(target) {
  try { require('node:fs').accessSync(target); return true; } catch { return false; }
}

function downloadDatasetWithKaggleHub() {
  try {
    const hasKaggleHub = execFileSync('python3', ['-c', "import importlib.util; print(bool(importlib.util.find_spec('kagglehub')))"] , { encoding: 'utf8' }).trim() === 'True';
    if (!hasKaggleHub) return null;
    const output = execFileSync('python3', ['-c', `import kagglehub; print(kagglehub.dataset_download('${DATASET_SLUG}'))`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
    const root = output.split('\n').pop()?.trim();
    return root && fsSyncExists(root) ? root : null;
  } catch { return null; }
}

function imageIndex(root) {
  const stack = [root];
  const index = new Map();
  if (!root) return index;
  while (stack.length) {
    const dir = stack.pop();
    let entries = [];
    try { entries = require('node:fs').readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (/\.(jpe?g|png|webp)$/i.test(entry.name)) {
        const base = cleanFilename(entry.name);
        const stem = base.replace(/\.[^.]+$/, '');
        for (const key of [base, base.toLowerCase(), stem, stem.toLowerCase()]) if (!index.has(key)) index.set(key, full);
      }
    }
  }
  return index;
}

async function downloadBytes(url, attempts = 2) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'MYPA-recipe-image-transport/3.0', Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.7' } });
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

async function validateSourceImage(body) {
  const meta = await sharp(body, { failOn: 'none' }).rotate().metadata();
  if (!meta.width || !meta.height) throw new Error('Source image has no dimensions');
  if (meta.width < 320 || meta.height < 220) throw new Error(`Source image too small: ${meta.width}x${meta.height}`);
  const ratio = meta.width / meta.height;
  if (ratio < 0.35 || ratio > 3) throw new Error(`Source image aspect ratio rejected: ${ratio.toFixed(2)}`);
  return { width: meta.width, height: meta.height };
}

async function compressToWebp(input) {
  await validateSourceImage(input);
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

async function mirrorExisting(recipe, relation) {
  const storageKey = `recipes/${recipe.id}/hero.webp`;
  const dest = path.join(IMAGE_ROOT, storageKey);
  try {
    const existing = await fs.readFile(dest);
    const meta = await sharp(existing).metadata();
    if (meta.format === 'webp' && existing.length >= MIN_BYTES && existing.length <= MAX_BYTES && (meta.width || 0) >= 320 && (meta.height || 0) >= 220) return { status: 'present-local' };
  } catch {}
  const sourceUrl = publicStorageUrl(relation?.storage_key) || relation?.image_url || null;
  if (!sourceUrl) throw new Error('Existing hero has no usable image source');
  const body = await downloadBytes(sourceUrl);
  const compressed = await compressToWebp(body);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, compressed.out);
  await appendManifest({ recipeId: recipe.id, recipeName: recipe.name, status: 'mirrored', sourceType: 'supabase-mirror', sourceUrl: relation?.source_url || sourceUrl, storageKey, localPath: path.relative(ROOT, dest), bytes: compressed.out.length, width: compressed.width, height: compressed.height, sha256: await sha256(compressed.out), checkedAt: now() });
  return { status: 'mirrored' };
}

async function fetchSourceMappedImage(imageName, datasetRoot, index) {
  if (!datasetRoot) throw new Error('Canonical dataset root unavailable');
  for (const name of candidateNames(imageName)) {
    const variants = [name, name.toLowerCase(), name.replace(/\s+/g, ' '), name.replace(/\s+/g, ' ').toLowerCase()];
    for (const variant of variants) {
      const file = index.get(variant);
      if (!file) continue;
      const body = await fs.readFile(file);
      await validateSourceImage(body);
      return { body, originalUrl: `file://${file}`, imageName };
    }
  }
  throw new Error(`Canonical dataset image not found for ${imageName}`);
}

function normalizeUrl(value) {
  if (!value) return null;
  let url = String(value).trim().replaceAll('&amp;', '&').replaceAll('\\u003d', '=').replaceAll('\\u0026', '&').replaceAll('\\/', '/');
  if (url.startsWith('//')) url = `https:${url}`;
  return /^https?:\/\//i.test(url) ? url : null;
}

function isGoogleThumb(url) {
  return /encrypted-tbn|gstatic\.com\/images\/branding|googleusercontent\.com\/static/i.test(String(url));
}

function googleCandidatesFromHtml(html) {
  const found = [];
  const add = (value, rank = 0) => {
    const url = normalizeUrl(decodeURIComponentSafe(String(value).replaceAll('&amp;', '&')));
    if (url && !isGoogleThumb(url)) found.push({ url, rank });
  };
  for (const match of html.matchAll(/[?&]imgurl=([^&\"'<>]+)/gi)) add(match[1], 0);
  for (const match of html.matchAll(/data-iurl=[\"']([^\"']+)[\"']/gi)) add(match[1], 1);
  for (const match of html.matchAll(/data-original=[\"']([^\"']+)[\"']/gi)) add(match[1], 2);
  for (const match of html.matchAll(/href=[\"']([^\"']*\/imgres\?[^\"']+)[\"']/gi)) { try { const parsed = new URL(normalizeUrl(match[1]) || `https://www.google.com${match[1]}`); add(parsed.searchParams.get('imgurl'), -5); } catch {} }
  const seen = new Set();
  return found.sort((a, b) => a.rank - b.rank).map((x) => x.url).filter((url) => { const k = url.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
}

function decodeURIComponentSafe(value) { try { return decodeURIComponent(value); } catch { return value; } }

async function googleSearch(name) {
  const query = `${name} recipe finished dish`;
  for (const base of ['https://www.google.com/search?tbm=isch&hl=en&gl=us&q=', 'https://www.google.com/search?udm=2&hl=en&gl=us&q=']) {
    try {
      const searchUrl = `${base}${encodeURIComponent(query)}`;
      const response = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/140 Safari/537.36', Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9' } });
      const html = await response.text();
      if (response.ok) { const candidates = googleCandidatesFromHtml(html); if (candidates.length) return { sourceType: 'google-images', query, searchUrl, candidates }; }
    } catch {}
    await sleep(400);
  }
  throw new Error('Google returned no usable candidates');
}

function bingCandidatesFromHtml(html) {
  const urls = [];
  for (const match of html.matchAll(/\"murl\"\s*:\s*\"([^\"]+)\"/g)) { const url = normalizeUrl(match[1]); if (url && !isGoogleThumb(url)) urls.push(url); }
  for (const match of html.matchAll(/murl&quot;:&quot;([^&]+?)&quot;/g)) { const url = normalizeUrl(match[1]); if (url && !isGoogleThumb(url)) urls.push(url); }
  return [...new Set(urls)];
}

async function bingSearch(name) {
  const query = `${name} recipe finished dish`;
  const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`;
  const response = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/140 Safari/537.36', Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' } });
  const html = await response.text();
  if (!response.ok) throw new Error(`Bing Images search ${response.status}`);
  const candidates = bingCandidatesFromHtml(html);
  if (!candidates.length) throw new Error('Bing returned no usable candidates');
  return { sourceType: 'bing-images', query, searchUrl, candidates };
}

async function tryWebSearchImport(recipe) {
  const searches = [];
  if (BING_FALLBACK) { try { searches.push(await bingSearch(recipe.name)); } catch {} }
  if (GOOGLE_FALLBACK) { try { searches.push(await googleSearch(recipe.name)); } catch {} }
  let last;
  for (const search of searches) {
    for (let position = 0; position < Math.min(48, search.candidates.length); position += 1) {
      const imageUrl = search.candidates[position];
      try {
        const body = await downloadBytes(imageUrl, 2);
        const compressed = await compressToWebp(body);
        return { ...compressed, status: search.sourceType === 'bing-images' ? 'imported-bing-fallback-valid' : 'imported-google-first-valid', sourceType: search.sourceType, sourceUrl: imageUrl, searchUrl: search.searchUrl, query: search.query, resultPosition: position + 1 };
      } catch (error) { last = error; }
    }
  }
  throw last || new Error('All web image providers exhausted');
}

async function sha256(buffer) { return crypto.createHash('sha256').update(buffer).digest('hex'); }

async function writeCatalog(recipes) {
  await fs.writeFile(CATALOG_PATH, recipes.map((r) => JSON.stringify({ recipeId: r.id, name: r.name })).join('\n') + '\n');
}

async function countLocalHeroes() {
  let count = 0;
  async function walk(dir) {
    let entries = [];
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile() && entry.name === 'hero.webp') count += 1;
    }
  }
  await walk(path.join(IMAGE_ROOT, 'recipes'));
  return count;
}

async function main() {
  await ensureDirs();
  const { data: sample } = await supabase('recipes?select=id,name&limit=1');
  const recipes = (await fetchPaged('recipes?select=id,name&order=id.asc')).filter((r) => r?.id && String(r.name || '').trim());
  const heroes = await fetchPaged('recipe_images?select=recipe_id,image_type,image_url,storage_key,source_name,source_url,source_license,source_attribution&image_type=eq.hero&order=recipe_id.asc');
  const sourceRows = await fetchPaged('recipe_source_raw?select=recipe_id,image_name&order=recipe_id.asc');
  const sourceByRecipe = new Map();
  for (const row of sourceRows) { const id = row?.recipe_id; const imageName = String(row?.image_name || '').trim(); if (id && imageName && imageName !== '#NAME?' && !sourceByRecipe.has(String(id))) sourceByRecipe.set(String(id), imageName); }
  await writeCatalog(recipes);

  let datasetRoot = discoverDatasetRoot();
  if (!datasetRoot && AUTO_DOWNLOAD_DATASET && sourceByRecipe.size) datasetRoot = downloadDatasetWithKaggleHub();
  const datasetIndex = datasetRoot ? imageIndex(datasetRoot) : new Map();

  const relationByRecipe = new Map();
  for (const row of heroes) if (!relationByRecipe.has(String(row.recipe_id))) relationByRecipe.set(String(row.recipe_id), row);
  const manifestMap = await loadLatestManifest();
  const selected = recipes.slice(START, LIMIT > 0 ? START + LIMIT : undefined).filter((recipe) => {
    const latest = manifestMap.get(String(recipe.id));
    return !latest || !['present-local','mirrored','source-mapped-valid','imported-google-first-valid','imported-bing-fallback-valid'].includes(latest.status);
  });

  const stats = { startedAt: now(), totalRecipes: recipes.length, existingHeroRelations: heroes.length, sourceMappedRecipes: sourceByRecipe.size, sourceDatasetRoot: datasetRoot, sourceDatasetIndexedFiles: datasetIndex.size, selected: selected.length, skipped: 0, mirrored: 0, sourceMapped: 0, importedGoogle: 0, importedBing: 0, failed: 0, exhausted: 0, supabaseProbe: { sample } };
  console.log(JSON.stringify(stats, null, 2));

  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++; if (index >= selected.length) return;
      const recipe = selected[index]; const id = String(recipe.id); const latest = manifestMap.get(id);
      try {
        if (latest?.status === 'failed' && Number(latest.failureAttempt || 0) >= MAX_FAILURE_ATTEMPTS) { stats.exhausted += 1; console.log(`[EXHAUSTED] ${recipe.id} ${recipe.name}`); continue; }
        const relation = relationByRecipe.get(id);
        if (relation && MIRROR_EXISTING) {
          const mirrored = await mirrorExisting(recipe, relation);
          if (mirrored.status === 'mirrored') stats.mirrored += 1; else stats.skipped += 1;
          console.log(`[${mirrored.status}] ${recipe.id} ${recipe.name}`);
          continue;
        }

        let imported = null;
        let sourceError = null;
        const imageName = sourceByRecipe.get(id);
        if (SOURCE_MAPPED_FIRST && imageName && datasetRoot) {
          try {
            const source = await fetchSourceMappedImage(imageName, datasetRoot, datasetIndex);
            const compressed = await compressToWebp(source.body);
            const storageKey = `recipes/${recipe.id}/hero.webp`;
            const dest = path.join(IMAGE_ROOT, storageKey);
            await fs.mkdir(path.dirname(dest), { recursive: true });
            await fs.writeFile(dest, compressed.out);
            imported = { status: 'source-mapped-valid', sourceType: 'canonical-dataset', sourceName: DATASET_SOURCE, sourceUrl: DATASET_URL, originalUrl: source.originalUrl, imageName, storageKey, localPath: path.relative(ROOT, dest), bytes: compressed.out.length, width: compressed.width, height: compressed.height, sha256: await sha256(compressed.out), license: DATASET_LICENSE, attribution: `${DATASET_SOURCE}; exact image_name=${imageName}; final-dish hero; resized/recompressed to WebP <=60KB.` };
            stats.sourceMapped += 1;
            console.log(`[source-mapped-valid] ${recipe.id} ${recipe.name}`);
          } catch (error) { sourceError = error; }
        }
        if (!imported) {
          imported = await tryWebSearchImport(recipe);
          const storageKey = `recipes/${recipe.id}/hero.webp`;
          const dest = path.join(IMAGE_ROOT, storageKey);
          await fs.mkdir(path.dirname(dest), { recursive: true });
          await fs.writeFile(dest, imported.out);
          imported.storageKey = storageKey;
          imported.localPath = path.relative(ROOT, dest);
          imported.bytes = imported.out.length;
          imported.sha256 = await sha256(imported.out);
          imported.sourceName = imported.status === 'imported-google-first-valid' ? 'Google Images — first valid original image' : 'Bing Images — fallback provider';
          if (imported.status === 'imported-google-first-valid') stats.importedGoogle += 1; else stats.importedBing += 1;
          console.log(`[${imported.status}] ${recipe.id} ${recipe.name}`);
        }
        await appendManifest({ recipeId: recipe.id, recipeName: recipe.name, ...imported, importedAt: now(), sourceError: sourceError ? String(sourceError.message || sourceError) : null });
        manifestMap.set(id, { status: imported.status, failureAttempt: 0 });
      } catch (error) {
        const previous = Number(latest?.failureAttempt || 0);
        const row = { recipeId: recipe.id, recipeName: recipe.name, status: 'failed', failureAttempt: previous + 1, reason: error instanceof Error ? error.message : String(error), failedAt: now() };
        stats.failed += 1;
        await appendManifest(row);
        await appendFailure(row);
        manifestMap.set(id, row);
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

main().catch(async (error) => {
  console.error(error);
  await ensureDirs().catch(() => {});
  await appendFailure({ status: 'fatal', reason: error instanceof Error ? error.message : String(error), failedAt: now() }).catch(() => {});
  process.exit(1);
});
