import sharp from 'sharp';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE = Math.min(Math.max(Number(process.env.RECIPE_IMAGE_BATCH_SIZE || '500'), 1), 1000);
const CONCURRENCY = Math.min(Math.max(Number(process.env.RECIPE_IMAGE_CONCURRENCY || '4'), 1), 8);
const MAX_BYTES = 60 * 1024;
const BUCKET = 'recipe-images';
const WIKIMEDIA_API = 'https://commons.wikimedia.org/w/api.php';

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const authHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function getLicense(meta = {}) {
  const short = htmlToText(meta.LicenseShortName?.value || meta.LicenseShortName || meta.UsageTerms?.value || meta.UsageTerms || '');
  const terms = htmlToText(meta.UsageTerms?.value || meta.UsageTerms || '');
  const combined = `${short} ${terms}`.trim();

  if (/non[- ]?commercial|\bNC\b|no derivatives|\bND\b/i.test(combined)) return null;
  if (/CC0|public domain|public-domain/i.test(combined)) return { name: 'CC0 / Public Domain', url: htmlToText(meta.LicenseUrl?.value || meta.LicenseUrl || '') };
  if (/CC BY-SA/i.test(combined)) return { name: 'CC BY-SA', url: htmlToText(meta.LicenseUrl?.value || meta.LicenseUrl || '') };
  if (/CC BY/i.test(combined)) return { name: 'CC BY', url: htmlToText(meta.LicenseUrl?.value || meta.LicenseUrl || '') };
  return null;
}

function candidateScore(recipeName, candidate) {
  const recipe = normalize(recipeName);
  const title = normalize(candidate.title || '').replace(/^file /, '');
  const description = normalize(candidate.description || '');
  const tokens = recipe.split(' ').filter((token) => token.length >= 3);
  if (!tokens.length) return 0;
  const haystack = `${title} ${description}`;
  const overlap = tokens.filter((token) => haystack.includes(token)).length / tokens.length;
  const phrase = title.includes(recipe) || description.includes(recipe) ? 0.5 : 0;
  const bad = /(logo|icon|map|diagram|flag|screenshot|poster|cover|symbol)/i.test(candidate.title || '') ? 0.5 : 0;
  return Math.max(0, Math.min(1, overlap * 0.6 + phrase + 0.1 - bad));
}

async function fetchJson(url, attempts = 4) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'MyPersonalAssistant/1.0 recipe image importer' } });
      if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      await sleep(600 * 2 ** attempt);
    }
  }
  throw lastError;
}

async function supabaseJson(path, options = {}, attempts = 4) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        ...options,
        headers: { ...authHeaders, 'Content-Type': 'application/json', ...(options.headers || {}) },
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`${response.status} ${path}: ${text}`);
      return text ? JSON.parse(text) : null;
    } catch (error) {
      lastError = error;
      await sleep(500 * 2 ** attempt);
    }
  }
  throw lastError;
}

async function ensureBucket() {
  const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: BUCKET,
      name: BUCKET,
      public: true,
      file_size_limit: MAX_BYTES,
      allowed_mime_types: ['image/webp'],
    }),
  });
  if (response.ok || response.status === 409) return;
  const text = await response.text();
  throw new Error(`Unable to create/ensure Storage bucket: ${response.status} ${text}`);
}

async function getMissingRecipes() {
  const imageRows = await supabaseJson('recipe_images?select=recipe_id&image_type=eq.primary&limit=1000');
  const imageIds = new Set(imageRows.map((row) => row.recipe_id));
  const attempts = await supabaseJson("recipe_image_import_attempts?select=recipe_id&status=eq.skipped&limit=1000");
  const skippedIds = new Set(attempts.map((row) => row.recipe_id));
  const missing = [];
  let offset = 0;

  while (missing.length < BATCH_SIZE) {
    const rows = await supabaseJson(`recipes?select=id,name&order=created_at.asc,id.asc&limit=1000&offset=${offset}`);
    if (!rows.length) break;
    for (const recipe of rows) {
      if (!imageIds.has(recipe.id) && !skippedIds.has(recipe.id)) {
        missing.push(recipe);
        if (missing.length >= BATCH_SIZE) break;
      }
    }
    if (rows.length < 1000) break;
    offset += rows.length;
  }
  return missing;
}

async function markSkipped(recipeId, reason) {
  await supabaseJson('recipe_image_import_attempts', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ recipe_id: recipeId, status: 'skipped', reason, attempt_count: 1, updated_at: new Date().toISOString() }),
  });
}

async function searchWikimedia(recipeName) {
  const queries = [`"${recipeName}" food`, `"${recipeName}"`, recipeName];
  const candidates = [];
  const seen = new Set();

  for (const query of queries) {
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: query,
      gsrnamespace: '6',
      gsrlimit: '6',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: '1200',
      format: 'json',
      formatversion: '2',
    });

    const data = await fetchJson(`${WIKIMEDIA_API}?${params.toString()}`);
    for (const page of data?.query?.pages || []) {
      if (seen.has(page.pageid)) continue;
      seen.add(page.pageid);
      const info = page.imageinfo?.[0];
      if (!info?.thumburl && !info?.url) continue;
      const meta = info.extmetadata || {};
      const license = getLicense(meta);
      if (!license) continue;
      candidates.push({
        page,
        title: page.title,
        description: htmlToText(meta.ImageDescription?.value || meta.ObjectName?.value || ''),
        author: htmlToText(meta.Artist?.value || meta.Credit?.value || 'Wikimedia Commons contributor'),
        license,
        imageUrl: info.thumburl || info.url,
        sourceUrl: page.fullurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
      });
    }
    if (candidates.some((candidate) => candidateScore(recipeName, candidate) >= 0.75)) break;
    await sleep(250);
  }

  return candidates.sort((a, b) => candidateScore(recipeName, b) - candidateScore(recipeName, a));
}

async function downloadImage(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'MyPersonalAssistant/1.0 recipe image importer' } });
  if (!response.ok) throw new Error(`Image download failed: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function compressImage(input) {
  const dimensionSteps = [960, 800, 720, 640, 576, 512, 448, 384, 320];
  const qualitySteps = [72, 66, 60, 54, 48, 42, 36, 30];
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

  throw new Error(`No WebP variant fit within ${MAX_BYTES} bytes; smallest=${smallest?.byteLength ?? 'unknown'}`);
}

async function uploadObject(storageKey, buffer) {
  const encoded = storageKey.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encoded}`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'image/webp',
      'Cache-Control': '31536000',
      'x-upsert': 'true',
    },
    body: buffer,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Storage upload failed: ${response.status} ${text}`);
}

async function deleteObject(storageKey) {
  const encoded = storageKey.split('/').map(encodeURIComponent).join('/');
  await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encoded}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
}

async function processRecipe(recipe) {
  const candidates = await searchWikimedia(recipe.name);
  const candidate = candidates.find((item) => candidateScore(recipe.name, item) >= 0.55);
  if (!candidate) {
    await markSkipped(recipe.id, 'no sufficiently relevant licensed Commons image');
    return { recipeId: recipe.id, status: 'skipped', reason: 'no sufficiently relevant licensed Commons image' };
  }

  const original = await downloadImage(candidate.imageUrl);
  const compressed = await compressImage(original);
  const storageKey = `recipes/${recipe.id}/primary.webp`;
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storageKey.split('/').map(encodeURIComponent).join('/')}`;

  await uploadObject(storageKey, compressed.buffer);
  try {
    const licenseUrl = candidate.license.url ? ` ${candidate.license.url}` : '';
    await supabaseJson('recipe_images', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        recipe_id: recipe.id,
        image_type: 'primary',
        step_number: null,
        image_url: publicUrl,
        width: compressed.width,
        height: compressed.height,
        byte_size: compressed.buffer.byteLength,
        mime_type: 'image/webp',
        alt_text: recipe.name,
        sort_order: 0,
        storage_key: storageKey,
        source_name: 'Wikimedia Commons',
        source_url: candidate.sourceUrl,
        source_license: candidate.license.name,
        source_attribution: `${candidate.author}; Wikimedia Commons; ${candidate.license.name}.${licenseUrl} Modified: resized and recompressed to WebP <= 60KB.`,
      }),
    });
  } catch (error) {
    await deleteObject(storageKey);
    throw error;
  }

  return { recipeId: recipe.id, status: 'imported', bytes: compressed.buffer.byteLength, source: candidate.title };
}

async function mapConcurrent(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function runner() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      try {
        results[index] = await worker(items[index]);
      } catch (error) {
        results[index] = { recipeId: items[index].id, status: 'failed', error: error instanceof Error ? error.message : String(error) };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => runner()));
  return results;
}

async function main() {
  await ensureBucket();
  const recipes = await getMissingRecipes();
  if (!recipes.length) {
    console.log(JSON.stringify({ status: 'complete', imported: 0, message: 'No unattempted recipes remain.' }, null, 2));
    return;
  }

  const results = await mapConcurrent(recipes, CONCURRENCY, processRecipe);
  const imported = results.filter((x) => x?.status === 'imported').length;
  const skipped = results.filter((x) => x?.status === 'skipped').length;
  const failed = results.filter((x) => x?.status === 'failed').length;
  console.log(JSON.stringify({ status: 'batch-complete', requested: recipes.length, imported, skipped, failed, results }, null, 2));
  if (failed > 0 && imported === 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
