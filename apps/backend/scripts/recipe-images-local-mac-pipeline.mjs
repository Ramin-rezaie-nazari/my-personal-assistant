import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

/**
 * MYPA Local-first recipe hero mirror/importer.
 *
 * IMPORTANT:
 * - This script never writes to Supabase.
 * - Supabase is used only as a read source for the current recipe catalog
 *   and existing hero relations/storage URLs.
 * - All resulting recipe hero files, manifests and logs live on the Mac.
 * - Missing heroes are searched recipe-by-recipe through Google Images.
 * - The first downloaded candidate that passes image validation is used.
 */

const ROOT = path.resolve(process.env.RECIPE_LOCAL_ROOT || './data/mypa-recipe-media');
const IMAGE_ROOT = path.join(ROOT, 'images');
const MANIFEST_DIR = path.join(ROOT, 'manifests');
const LOG_DIR = path.join(ROOT, 'logs');
const CATALOG_PATH = path.join(ROOT, 'recipe-catalog.jsonl');
const MANIFEST_PATH = path.join(MANIFEST_DIR, 'recipe-hero-manifest.jsonl');
const SUMMARY_PATH = path.join(MANIFEST_DIR, 'summary.json');

const SUPABASE_URL = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const BUCKET = 'recipe-images';
const MAX_BYTES = 60 * 1024;
const PAGE_SIZE = 1000;
const LIMIT = Math.max(Number(process.env.RECIPE_LOCAL_LIMIT || '0'), 0);
const START = Math.max(Number(process.env.RECIPE_LOCAL_START || '0'), 0);
const CONCURRENCY = Math.min(Math.max(Number(process.env.RECIPE_LOCAL_CONCURRENCY || '2'), 1), 4);
const DELAY_MS = Math.max(Number(process.env.RECIPE_LOCAL_DELAY_MS || '2500'), 500);
const RETRY_FAILED = process.env.RECIPE_LOCAL_RETRY_FAILED !== '0';
const FORCE = process.env.RECIPE_LOCAL_FORCE === '1';
const MIRROR_EXISTING = process.env.RECIPE_LOCAL_MIRROR_EXISTING !== '0';
const GOOGLE_MISSING = process.env.RECIPE_LOCAL_GOOGLE_MISSING !== '0';
const CATALOG_ONLY = process.env.RECIPE_LOCAL_CATALOG_ONLY === '1';

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY locally. This script only reads from Supabase and never writes to it.');
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
    fs.mkdir(ROOT, { recursive: true }),
    fs.mkdir(IMAGE_ROOT, { recursive: true }),
    fs.mkdir(MANIFEST_DIR, { recursive: true }),
    fs.mkdir(LOG_DIR, { recursive: true }),
  ]);
}

async function supabase(pathname, options = {}, attempts = 6) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, {
        ...options,
        headers: { ...authHeaders, 'Content-Type': 'application/json', ...(options.headers || {}) },
      });
      const text = await response.text();
      if (response.ok) return { data: text ? JSON.parse(text) : null, response };
      if (response.status === 429 || response.status >= 500) {
        await sleep(Math.min(30_000, 1000 * 2 ** i));
        continue;
      }
      throw new Error(`${response.status} ${pathname}: ${text}`);
    } catch (error) {
      last = error;
      if (i < attempts - 1) await sleep(Math.min(30_000, 1000 * 2 ** i));
    }
  }
  throw last || new Error(`Supabase request failed: ${pathname}`);
}

async function verifySupabaseReadAccess() {
  const { data, response } = await supabase(
    'recipes?select=id,name&order=id.asc&limit=1',
    { headers: { Prefer: 'count=exact' } },
    3,
  );
  const contentRange = response.headers.get('content-range') || '';
  const totalMatch = contentRange.match(/\/(\d+)$/);
  const total = totalMatch ? Number(totalMatch[1]) : null;
  if (!Array.isArray(data)) throw new Error('Supabase recipes response is not an array.');
  if (total === 0 || (total === null && data.length === 0)) {
    throw new Error(`Supabase read returned 0 recipes. Verify SUPABASE_URL points to the intended project and the supplied key has read access to public.recipes. URL=${SUPABASE_URL}`);
  }
  return { total, sample: data[0] || null };
}

function unwrap(result) {
  return result?.data ?? result;
}

function publicStorageUrl(storageKey) {
  if (!storageKey) return null;
  const encoded = String(storageKey).split('/').map(encodeURIComponent).join('/');
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encoded}`;
}

async function fetchAllRecipes() {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const result = await supabase(`recipes?select=id,name&order=id.asc&limit=${PAGE_SIZE}&offset=${offset}`);
    const page = unwrap(result);
    rows.push(...(page || []).filter((r) => r?.id && String(r.name || '').trim()));
    if (!page || page.length < PAGE_SIZE) break;
  }
  return rows;
}

async function fetchHeroRelations() {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const result = await supabase(
      `recipe_images?select=recipe_id,image_type,image_url,storage_key,width,height,byte_size,mime_type,source_name,source_url,source_license,source_attribution&image_type=eq.hero&order=recipe_id.asc&limit=${PAGE_SIZE}&offset=${offset}`,
    );
    const page = unwrap(result);
    rows.push(...(page || []));
    if (!page || page.length < PAGE_SIZE) break;
  }
  return rows;
}

function normalizeUrl(url) {
  if (!url) return null;
  let value = String(url).trim().replaceAll('\\u003d', '=').replaceAll('\\u0026', '&').replaceAll('\\/', '/');
  if (value.startsWith('//')) value = `https:${value}`;
  return /^https?:\/\//i.test(value) ? value : null;
}

function decodeGoogleString(value) {
  try {
    return JSON.parse(`"${String(value).replace(/"/g, '\\"')}"`);
  } catch {
    return String(value).replaceAll('\\/', '/').replaceAll('\\u0026', '&');
  }
}

function extractImageCandidates(html) {
  const candidates = [];
  const regexes = [
    /"ou"\s*:\s*"((?:\\.|[^"\\])+)"/g,
    /\\"ou\\"\s*:\s*\\"((?:\\.|[^"\\])+)\\"/g,
    /[?&]imgurl=([^&"']+)/g,
    /data-iurl=["']([^"']+)["']/g,
    /data-original=["']([^"']+)["']/g,
  ];
  for (const regex of regexes) {
    for (const match of html.matchAll(regex)) {
      let value = match[1];
      try { value = decodeURIComponent(value); } catch {}
      if (regex.source.includes('"ou"')) value = decodeGoogleString(value);
      const url = normalizeUrl(value);
      if (url) candidates.push(url);
    }
  }
  return [...new Set(candidates)].filter((url) => {
    const lower = url.toLowerCase();
    return !lower.includes('gstatic.com/images/branding') &&
      !lower.includes('googleusercontent.com/static') &&
      !lower.includes('google.com/images/branding');
  });
}

async function googleCandidates(recipeName) {
  const query = `${recipeName} recipe`;
  const bases = [
    'https://www.google.com/search?tbm=isch&hl=en&gl=us&q=',
    'https://www.google.com/search?udm=2&hl=en&gl=us&q=',
  ];
  let last;
  for (const base of bases) {
    const searchUrl = `${base}${encodeURIComponent(query)}`;
    try {
      const response = await fetch(searchUrl, {
        redirect: 'follow',
        headers: {
          'User-Agent': process.env.RECIPE_GOOGLE_USER_AGENT ||
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/140 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
      });
      const html = await response.text();
      if (!response.ok) {
        last = new Error(`Google search ${response.status}`);
        await sleep(1500);
        continue;
      }
      const candidates = extractImageCandidates(html);
      if (candidates.length) return { query, searchUrl, candidates };
      last = new Error(/consent|unusual traffic|captcha|not a robot/i.test(html)
        ? 'Google Images blocked/consent challenge'
        : 'No image candidates in Google response');
    } catch (error) {
      last = error;
    }
    await sleep(1500);
  }
  throw last || new Error('Google Images search failed');
}

async function downloadBytes(url) {
  let last;
  for (let i = 0; i < 4; i += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 MYPA local recipe image importer',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.7',
        },
      });
      if (response.ok) {
        const body = Buffer.from(await response.arrayBuffer());
        if (!body.length) throw new Error('Downloaded image is empty');
        return body;
      }
      last = new Error(`Image download ${response.status}`);
      if (response.status < 500 && response.status !== 429) break;
    } catch (error) {
      last = error;
    }
    await sleep(Math.min(20_000, 1000 * 2 ** i));
  }
  throw last || new Error('Image download failed');
}

async function validateAndCompress(input) {
  const source = sharp(input, { failOn: 'none' }).rotate();
  const metadata = await source.metadata();
  if (!metadata.width || !metadata.height) throw new Error('Image has no dimensions');
  if (metadata.width < 220 || metadata.height < 220) throw new Error(`Image too small: ${metadata.width}x${metadata.height}`);
  const ratio = metadata.width / metadata.height;
  if (ratio < 0.35 || ratio > 3.0) throw new Error(`Image aspect ratio rejected: ${ratio.toFixed(2)}`);

  let best = null;
  for (const width of [960, 880, 800, 720, 640, 576, 512, 448, 384, 320]) {
    for (const quality of [76, 70, 64, 58, 52, 46, 40, 34, 28]) {
      const out = await sharp(input, { failOn: 'none' })
        .rotate()
        .resize({ width, fit: 'inside', withoutEnlargement: true })
        .webp({ quality, effort: 6 })
        .toBuffer();
      if (!best || out.byteLength < best.byteLength) best = out;
      if (out.byteLength <= MAX_BYTES) {
        const outMeta = await sharp(out, { failOn: 'none' }).metadata();
        return { out, width: outMeta.width ?? width, height: outMeta.height ?? width, inputMime: metadata.format || null };
      }
    }
  }
  throw new Error(`Could not reach ${MAX_BYTES} bytes; smallest=${best?.byteLength ?? 'unknown'}`);
}

async function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function loadExistingManifest() {
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

async function appendErrorLog(row) {
  await fs.appendFile(path.join(LOG_DIR, 'failures.jsonl'), `${JSON.stringify(row)}\n`);
}

async function writeCatalog(recipes) {
  const lines = recipes.map((r) => JSON.stringify({ recipeId: r.id, name: r.name })).join('\n') + (recipes.length ? '\n' : '');
  await fs.writeFile(CATALOG_PATH, lines, 'utf8');
}

async function mirrorExisting(recipe, relation, manifestMap) {
  const key = `recipes/${recipe.id}/hero.webp`;
  const destination = path.join(IMAGE_ROOT, key);

  try {
    const existing = await fs.readFile(destination);
    const meta = await sharp(existing, { failOn: 'none' }).metadata();
    if (meta.format === 'webp' && existing.byteLength <= MAX_BYTES && meta.width && meta.height) {
      const digest = await sha256(existing);
      const row = {
        recipeId: recipe.id,
        recipeName: recipe.name,
        status: 'present-local',
        sourceType: 'supabase-mirror',
        sourceName: relation?.source_name ?? null,
        sourceUrl: relation?.source_url ?? null,
        storageKey: key,
        localPath: path.relative(ROOT, destination),
        bytes: existing.byteLength,
        width: meta.width,
        height: meta.height,
        sha256: digest,
        checkedAt: now(),
      };
      await appendManifest(row);
      manifestMap.set(String(recipe.id), row);
      return row;
    }
  } catch {}

  const sourceUrl = normalizeUrl(relation?.image_url) || publicStorageUrl(relation?.storage_key || key);
  if (!sourceUrl) throw new Error('Existing hero has no usable image_url/storage_key');
  const input = await downloadBytes(sourceUrl);
  const compressed = await validateAndCompress(input);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, compressed.out);
  const digest = await sha256(compressed.out);
  const row = {
    recipeId: recipe.id,
    recipeName: recipe.name,
    status: 'mirrored',
    sourceType: 'supabase-mirror',
    sourceName: relation?.source_name ?? null,
    sourceUrl: relation?.source_url ?? sourceUrl,
    originalUrl: sourceUrl,
    storageKey: relation?.storage_key ?? key,
    localPath: path.relative(ROOT, destination),
    bytes: compressed.out.byteLength,
    width: compressed.width,
    height: compressed.height,
    sha256: digest,
    checkedAt: now(),
  };
  await appendManifest(row);
  manifestMap.set(String(recipe.id), row);
  return row;
}

async function importMissing(recipe, manifestMap) {
  const existing = manifestMap.get(String(recipe.id));
  if (!FORCE && existing?.status && existing.status !== 'failed') return { status: 'skipped-existing-manifest' };

  const { query, searchUrl, candidates } = await googleCandidates(recipe.name);
  let candidateIndex = 0;
  let last;
  for (const imageUrl of candidates.slice(0, 12)) {
    candidateIndex += 1;
    try {
      const input = await downloadBytes(imageUrl);
      const compressed = await validateAndCompress(input);
      const destination = path.join(IMAGE_ROOT, `recipes/${recipe.id}/hero.webp`);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, compressed.out);
      const digest = await sha256(compressed.out);
      const row = {
        recipeId: recipe.id,
        recipeName: recipe.name,
        status: 'imported-google-first-valid',
        sourceType: 'google-images',
        sourceName: 'Google Images — first valid downloaded result',
        sourceUrl: imageUrl,
        searchUrl,
        query,
        resultPosition: candidateIndex,
        storageKey: `recipes/${recipe.id}/hero.webp`,
        localPath: path.relative(ROOT, destination),
        bytes: compressed.out.byteLength,
        width: compressed.width,
        height: compressed.height,
        sha256: digest,
        importedAt: now(),
      };
      await appendManifest(row);
      manifestMap.set(String(recipe.id), row);
      return row;
    } catch (error) {
      last = error;
    }
  }
  throw last || new Error('All Google image candidates failed validation/download');
}

async function main() {
  await ensureDirs();
  const access = await verifySupabaseReadAccess();
  const [recipes, heroRelations] = await Promise.all([fetchAllRecipes(), fetchHeroRelations()]);
  if (recipes.length === 0) {
    throw new Error(`Read access succeeded but 0 recipe rows were returned. Probe total=${access.total ?? 'unknown'}, sample=${JSON.stringify(access.sample)}`);
  }
  const relationByRecipe = new Map();
  for (const row of heroRelations) {
    if (!relationByRecipe.has(String(row.recipe_id))) relationByRecipe.set(String(row.recipe_id), row);
  }

  await writeCatalog(recipes);
  const manifestMap = await loadExistingManifest();
  const inRange = recipes.slice(START, LIMIT > 0 ? START + LIMIT : undefined);

  const stats = {
    startedAt: now(),
    totalRecipes: recipes.length,
    existingHeroRelations: heroRelations.length,
    localManifestBefore: manifestMap.size,
    selected: inRange.length,
    mirrored: 0,
    importedGoogle: 0,
    skipped: 0,
    failed: 0,
    catalogOnly: CATALOG_ONLY,
  };

  console.log(JSON.stringify({ ...stats, supabaseProbe: access }, null, 2));
  if (CATALOG_ONLY) {
    stats.finishedAt = now();
    await fs.writeFile(SUMMARY_PATH, JSON.stringify(stats, null, 2));
    return;
  }

  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= inRange.length) return;
      const recipe = inRange[index];
      const relation = relationByRecipe.get(String(recipe.id));
      try {
        const hasLocal = manifestMap.get(String(recipe.id))?.status && !FORCE;
        let row = null;
        if (hasLocal) {
          stats.skipped += 1;
          console.log(`[SKIP] ${recipe.id} ${recipe.name}`);
        } else if (relation && MIRROR_EXISTING) {
          row = await mirrorExisting(recipe, relation, manifestMap);
          if (row.status === 'mirrored') stats.mirrored += 1;
          else stats.skipped += 1;
          console.log(`[MIRROR] ${recipe.id} ${recipe.name}`);
        } else if (GOOGLE_MISSING) {
          row = await importMissing(recipe, manifestMap);
          stats.importedGoogle += 1;
          console.log(`[GOOGLE] ${recipe.id} ${recipe.name} -> result #${row.resultPosition}`);
        } else {
          stats.skipped += 1;
        }
      } catch (error) {
        stats.failed += 1;
        const reason = error instanceof Error ? error.message : String(error);
        const row = {
          recipeId: recipe.id,
          recipeName: recipe.name,
          status: 'failed',
          reason,
          sourceType: relation ? 'supabase-mirror' : 'google-images',
          failedAt: now(),
        };
        await appendManifest(row);
        await appendErrorLog(row);
        if (!RETRY_FAILED) manifestMap.set(String(recipe.id), row);
        console.error(`[FAILED] ${recipe.id} ${recipe.name}: ${reason}`);
      }
      await sleep(DELAY_MS);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, inRange.length) }, () => worker()));
  stats.finishedAt = now();
  stats.localManifestAfter = manifestMap.size;
  stats.localHeroFiles = await countLocalHeroFiles();
  await fs.writeFile(SUMMARY_PATH, JSON.stringify(stats, null, 2));
  console.log(JSON.stringify(stats, null, 2));

  if (stats.failed > 0) process.exitCode = 1;
}

async function countLocalHeroFiles() {
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
  await appendErrorLog({ status: 'fatal', reason: error instanceof Error ? error.message : String(error), failedAt: now() }).catch(() => {});
  process.exit(1);
});