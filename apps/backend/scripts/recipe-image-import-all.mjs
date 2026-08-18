import sharp from 'sharp';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'recipe-images';
const MAX_BYTES = 60 * 1024;
const BATCH_SIZE = Math.min(Math.max(Number(process.env.RECIPE_IMAGE_BATCH_SIZE || '100'), 1), 500);
const CONCURRENCY = 1;
const WIKIMEDIA_API = 'https://commons.wikimedia.org/w/api.php';
const WIKIMEDIA_DELAY_MS = Math.max(Number(process.env.WIKIMEDIA_DELAY_MS || '1500'), 1000);
const MAX_RECIPE_PASSES = Math.max(Number(process.env.RECIPE_IMAGE_MAX_PASSES || '20'), 1);
const USER_AGENT = 'MyPersonalAssistant/1.0 (https://github.com/Ramin-rezaie-nazari/my-personal-assistant)';

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const authHeaders = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

function htmlToText(value = '') {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function normalize(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value) {
  return normalize(value).split(' ').filter((token) => token.length >= 3);
}

function getLicense(meta = {}) {
  const combined = `${htmlToText(meta.LicenseShortName?.value || meta.LicenseShortName || '')} ${htmlToText(meta.UsageTerms?.value || meta.UsageTerms || '')}`.trim();
  if (/non[- ]?commercial|\bNC\b|no derivatives|\bND\b/i.test(combined)) return null;
  const url = htmlToText(meta.LicenseUrl?.value || meta.LicenseUrl || '');
  if (/CC0|public domain|public-domain/i.test(combined)) return { name: 'CC0 / Public Domain', url };
  if (/CC BY-SA/i.test(combined)) return { name: 'CC BY-SA', url };
  if (/CC BY/i.test(combined)) return { name: 'CC BY', url };
  return null;
}

function candidateScore(recipeName, candidate) {
  const rt = tokens(recipeName);
  const tt = tokens(candidate.title || '');
  const dt = tokens(candidate.description || '');
  if (!rt.length) return 0;

  const titleSet = new Set(tt);
  const descSet = new Set(dt);
  const titleHits = rt.filter((token) => titleSet.has(token)).length;
  const descHits = rt.filter((token) => descSet.has(token)).length;
  const best = Math.max(titleHits, descHits);
  const coverage = best / rt.length;
  const exactPhrase = normalize(candidate.title || '').includes(normalize(recipeName));

  if (rt.length <= 2) return exactPhrase || best === rt.length ? 1 : 0;
  if (exactPhrase) return 1;
  if (coverage >= 0.8) return 0.85;
  return 0;
}

function candidateIsSafe(recipeName, candidate) {
  if (candidateScore(recipeName, candidate) < 0.8) return false;
  const title = String(candidate.title || '');
  if (/(logo|icon|map|diagram|flag|screenshot|poster|cover|symbol|restaurant interior|building|street)/i.test(title)) return false;
  return true;
}

async function fetchJson(url, attempts = 6) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      const body = await response.text();
      if (response.ok) return body ? JSON.parse(body) : null;
      if (response.status === 429 || response.status === 503) {
        const retryAfter = Number(response.headers.get('retry-after') || '0');
        const waitMs = retryAfter > 0 ? retryAfter * 1000 : Math.max(5000, 3000 * 2 ** attempt);
        await sleep(waitMs);
        continue;
      }
      throw new Error(`${response.status} ${body}`);
    } catch (error) {
      lastError = error;
      await sleep(1500 * 2 ** attempt);
    }
  }
  throw lastError;
}

async function supabaseJson(path, options = {}, attempts = 5) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        ...options,
        headers: { ...authHeaders, 'Content-Type': 'application/json', ...(options.headers || {}) },
      });
      const text = await response.text();
      if (response.ok) return text ? JSON.parse(text) : null;
      if (response.status === 429 || response.status >= 500) {
        await sleep(1000 * 2 ** attempt);
        continue;
      }
      throw new Error(`${response.status} ${path}: ${text}`);
    } catch (error) {
      lastError = error;
      await sleep(1000 * 2 ** attempt);
    }
  }
  throw lastError;
}

async function ensureBucket() {
  const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, file_size_limit: MAX_BYTES, allowed_mime_types: ['image/webp'] }),
  });
  if (response.ok) return;
  const text = await response.text();
  let payload = null;
  try { payload = JSON.parse(text); } catch { /* ignore */ }
  if (response.status === 409 || payload?.code === 'BucketAlreadyExists' || payload?.statusCode === '409') return;
  throw new Error(`Unable to create/ensure Storage bucket: ${response.status} ${text}`);
}

async function getExistingImageIds() {
  const ids = new Set();
  let offset = 0;
  while (true) {
    const rows = await supabaseJson(`recipe_images?select=recipe_id&image_type=eq.hero&limit=1000&offset=${offset}`);
    for (const row of rows || []) ids.add(row.recipe_id);
    if (!rows || rows.length < 1000) break;
    offset += rows.length;
  }
  return ids;
}

async function getSkippedIds() {
  const ids = new Set();
  let offset = 0;
  while (true) {
    const rows = await supabaseJson(`recipe_image_import_attempts?select=recipe_id&status=eq.skipped&limit=1000&offset=${offset}`);
    for (const row of rows || []) ids.add(row.recipe_id);
    if (!rows || rows.length < 1000) break;
    offset += rows.length;
  }
  return ids;
}

async function getNextRecipes(existingIds, skippedIds) {
  const rows = [];
  let offset = 0;
  while (rows.length < BATCH_SIZE) {
    const page = await supabaseJson(`recipes?select=id,name&order=created_at.asc,id.asc&limit=1000&offset=${offset}`);
    if (!page?.length) break;
    for (const recipe of page) {
      if (!existingIds.has(recipe.id) && !skippedIds.has(recipe.id)) {
        rows.push(recipe);
        if (rows.length >= BATCH_SIZE) break;
      }
    }
    if (page.length < 1000) break;
    offset += page.length;
  }
  return rows;
}

async function markAttempt(recipeId, status, reason) {
  await supabaseJson('recipe_image_import_attempts', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ recipe_id: recipeId, status, reason, attempt_count: 1, updated_at: new Date().toISOString() }),
  });
}

async function searchWikimedia(recipeName) {
  const params = new URLSearchParams({
    action: 'query', generator: 'search', gsrsearch: `"${recipeName}"`, gsrnamespace: '6', gsrlimit: '10',
    prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '900', format: 'json', formatversion: '2',
  });

  await sleep(WIKIMEDIA_DELAY_MS);
  const data = await fetchJson(`${WIKIMEDIA_API}?${params.toString()}`);
  const candidates = [];
  for (const page of data?.query?.pages || []) {
    const info = page.imageinfo?.[0];
    if (!info?.thumburl && !info?.url) continue;
    const meta = info.extmetadata || {};
    const license = getLicense(meta);
    if (!license) continue;
    const candidate = {
      title: page.title,
      description: htmlToText(meta.ImageDescription?.value || meta.ObjectName?.value || ''),
      author: htmlToText(meta.Artist?.value || meta.Credit?.value || 'Wikimedia Commons contributor'),
      license,
      imageUrl: info.thumburl || info.url,
      sourceUrl: page.fullurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
    };
    if (candidateIsSafe(recipeName, candidate)) candidates.push(candidate);
  }
  return candidates.sort((a, b) => candidateScore(recipeName, b) - candidateScore(recipeName, a));
}

async function downloadImage(url) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`Image download failed: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function compressImage(input) {
  const dimensionSteps = [900, 800, 720, 640, 576, 512, 448, 384, 320];
  const qualitySteps = [74, 68, 62, 56, 50, 44, 38, 32];
  let smallest = null;
  for (const width of dimensionSteps) {
    for (const quality of qualitySteps) {
      const buffer = await sharp(input)
        .rotate()
        .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
        .webp({ quality, effort: 6 })
        .toBuffer();
      if (!smallest || buffer.byteLength < smallest.byteLength) smallest = buffer;
      if (buffer.byteLength <= MAX_BYTES) {
        const meta = await sharp(buffer).metadata();
        return { buffer, width: meta.width ?? width, height: meta.height ?? width };
      }
    }
  }
  throw new Error(`No WebP variant <= ${MAX_BYTES} bytes; smallest=${smallest?.byteLength ?? 'unknown'}`);
}

async function uploadObject(storageKey, buffer) {
  const encoded = storageKey.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encoded}`, {
    method: 'POST', headers: { ...authHeaders, 'Content-Type': 'image/webp', 'Cache-Control': '31536000', 'x-upsert': 'true' }, body: buffer,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Storage upload failed: ${response.status} ${text}`);
}

async function deleteObject(storageKey) {
  const encoded = storageKey.split('/').map(encodeURIComponent).join('/');
  await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encoded}`, { method: 'DELETE', headers: authHeaders });
}

async function processRecipe(recipe) {
  const candidates = await searchWikimedia(recipe.name);
  const candidate = candidates[0];
  if (!candidate) {
    await markAttempt(recipe.id, 'skipped', 'no sufficiently relevant licensed Commons image');
    return { recipeId: recipe.id, status: 'skipped' };
  }

  const original = await downloadImage(candidate.imageUrl);
  const compressed = await compressImage(original);
  const storageKey = `recipes/${recipe.id}/hero.webp`;
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storageKey.split('/').map(encodeURIComponent).join('/')}`;

  await uploadObject(storageKey, compressed.buffer);
  try {
    await supabaseJson('recipe_images', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        recipe_id: recipe.id, image_type: 'hero', step_number: null, image_url: publicUrl,
        width: compressed.width, height: compressed.height, byte_size: compressed.buffer.byteLength,
        mime_type: 'image/webp', alt_text: recipe.name, sort_order: 0, storage_key: storageKey,
        source_name: 'Wikimedia Commons', source_url: candidate.sourceUrl, source_license: candidate.license.name,
        source_attribution: `${candidate.author}; Wikimedia Commons; ${candidate.license.name}${candidate.license.url ? ` ${candidate.license.url}` : ''} Modified: resized and recompressed to WebP <= 60KB.`,
      }),
    });
  } catch (error) {
    await deleteObject(storageKey);
    throw error;
  }
  return { recipeId: recipe.id, status: 'imported', bytes: compressed.buffer.byteLength, source: candidate.title };
}

async function main() {
  await ensureBucket();
  const existingIds = await getExistingImageIds();
  const skippedIds = await getSkippedIds();
  let totalImported = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  let noProgressPasses = 0;

  for (let pass = 1; pass <= MAX_RECIPE_PASSES; pass += 1) {
    const batch = await getNextRecipes(existingIds, skippedIds);
    if (!batch.length) break;
    let importedThisPass = 0;

    for (const recipe of batch) {
      try {
        const result = await processRecipe(recipe);
        if (result.status === 'imported') {
          existingIds.add(recipe.id);
          importedThisPass += 1;
          totalImported += 1;
        } else {
          skippedIds.add(recipe.id);
          totalSkipped += 1;
        }
      } catch (error) {
        totalFailed += 1;
        await markAttempt(recipe.id, 'failed', error instanceof Error ? error.message : String(error));
        console.error(JSON.stringify({ recipeId: recipe.id, status: 'failed', error: error instanceof Error ? error.message : String(error) }));
      }
    }

    if (importedThisPass === 0 && batch.every((recipe) => skippedIds.has(recipe.id) === false)) {
      noProgressPasses += 1;
    } else {
      noProgressPasses = 0;
    }

    console.log(JSON.stringify({ pass, batch: batch.length, totalImported, totalSkipped, totalFailed }, null, 2));
    if (noProgressPasses >= 3) {
      throw new Error('Stopped after 3 consecutive no-progress passes; rerun after reviewing failed records.');
    }
  }

  console.log(JSON.stringify({ status: 'complete', totalImported, totalSkipped, totalFailed }, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); });
