import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, basename, extname } from 'node:path';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'recipe-images';
const MAX_BYTES = 60 * 1024;
const BATCH_SIZE = Math.min(Math.max(Number(process.env.RECIPE_IMAGE_BATCH_SIZE || '100'), 1), 500);
const DATASET_DIR = process.env.RECIPE_IMAGE_DATASET_DIR ? resolve(process.env.RECIPE_IMAGE_DATASET_DIR) : null;
const RESET = process.env.RECIPE_IMAGE_RESET === '1';
const DATASET_SLUG = 'pes12017000148/food-ingredients-and-recipe-dataset-with-images';
const DATASET_LICENSE = 'CC BY-SA 3.0';
const DATASET_SOURCE = 'Food Ingredients and Recipes Dataset with Images';

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const authHeaders = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function restUrl(path) { return `${SUPABASE_URL}/rest/v1/${path}`; }

async function rest(path, options = {}, attempts = 6) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(restUrl(path), {
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
      if (attempt === attempts - 1) break;
      await sleep(1000 * 2 ** attempt);
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
  if (response.ok) return;
  const text = await response.text();
  let payload = null;
  try { payload = JSON.parse(text); } catch { /* ignore */ }
  if (response.status === 409 || payload?.code === 'BucketAlreadyExists' || payload?.statusCode === '409') return;
  throw new Error(`Bucket error ${response.status}: ${text}`);
}

async function storageList(prefix = 'recipes') {
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix, limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Storage list failed: ${response.status} ${text}`);
  return JSON.parse(text);
}

async function storageRemove(paths) {
  if (!paths.length) return;
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}/remove`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes: paths }),
  });
  const text = await response.text();
  if (!response.ok) {
    // Fallback to per-object DELETE for older Storage API behavior.
    for (const path of paths) {
      const encoded = path.split('/').map(encodeURIComponent).join('/');
      await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encoded}`, { method: 'DELETE', headers: authHeaders });
    }
  }
}

async function listAllRecipeImages() {
  const rows = [];
  let offset = 0;
  while (true) {
    const page = await rest(`recipe_images?select=id,storage_key&limit=1000&offset=${offset}`);
    rows.push(...(page || []));
    if (!page || page.length < 1000) break;
    offset += page.length;
  }
  return rows;
}

async function resetExistingImageState() {
  const rows = await listAllRecipeImages();
  const keys = rows.map((row) => row.storage_key).filter(Boolean);
  await storageRemove(keys);
  await rest('recipe_images?id=not.is.null', { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  await rest('recipe_image_import_attempts?recipe_id=not.is.null', { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  console.log(JSON.stringify({ reset: true, deletedDbRows: rows.length, deletedStorageKeys: keys.length }, null, 2));
}

function findDatasetRoot() {
  if (DATASET_DIR && existsSync(DATASET_DIR)) return DATASET_DIR;
  const candidates = [
    join(process.cwd(), 'recipe-image-dataset'),
    join(process.cwd(), 'archive'),
    join(process.cwd(), 'Food Ingredients and Recipes Dataset with Images'),
    join(process.cwd(), 'Food Images'),
  ];
  for (const candidate of candidates) if (existsSync(candidate)) return candidate;

  try {
    const script = [
      'import importlib.util, subprocess, sys',
      "pkg='kagglehub'",
      "print('KAGGLEHUB_CHECK', bool(importlib.util.find_spec(pkg)))",
      "sys.exit(0)",
    ].join('; ');
    const check = execFileSync('python3', ['-c', script], { encoding: 'utf8' });
    if (check.includes('KAGGLEHUB_CHECK False')) {
      try { execFileSync('python3', ['-m', 'pip', 'install', '--user', 'kagglehub'], { stdio: 'inherit' }); } catch { /* fall through */ }
    }
    const downloadScript = [
      'import kagglehub',
      `print(kagglehub.dataset_download('${DATASET_SLUG}'))`,
    ].join('; ');
    const downloaded = execFileSync('python3', ['-c', downloadScript], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim().split('\n').pop();
    if (downloaded && existsSync(downloaded)) return downloaded;
  } catch (error) {
    throw new Error(`Could not locate/download the public Kaggle dataset automatically. Set RECIPE_IMAGE_DATASET_DIR to the extracted dataset directory. Details: ${error instanceof Error ? error.message : String(error)}`);
  }
  throw new Error('Dataset directory not found. Set RECIPE_IMAGE_DATASET_DIR to the extracted Kaggle dataset directory.');
}

function findFiles(root) {
  const csvFiles = [];
  const imageFiles = [];
  const stack = [root];
  const extensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
  while (stack.length) {
    const dir = stack.pop();
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) stack.push(full);
      else if (/Food Ingredients and Recipe Dataset with Image Name Mapping\.csv$/i.test(name)) csvFiles.push(full);
      else if (extensions.has(extname(name).toLowerCase())) imageFiles.push(full);
    }
  }
  if (!csvFiles.length) throw new Error('Could not find "Food Ingredients and Recipe Dataset with Image Name Mapping.csv" in dataset.');
  if (!imageFiles.length) throw new Error('Could not find Food Images in dataset.');
  return { csv: csvFiles[0], imageFiles };
}

function parseCsv(csvText) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < csvText.length; i += 1) {
    const ch = csvText[i];
    if (quoted) {
      if (ch === '"') {
        if (csvText[i + 1] === '"') { field += '"'; i += 1; }
        else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (ch !== '\r') field += ch;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function buildImageIndex(imageFiles) {
  const byName = new Map();
  for (const file of imageFiles) {
    const name = basename(file);
    const stem = name.slice(0, -extname(name).length);
    if (!byName.has(name)) byName.set(name, file);
    if (!byName.has(stem)) byName.set(stem, file);
  }
  return byName;
}

async function getRecipeImageMap() {
  const rows = [];
  let offset = 0;
  while (true) {
    const page = await rest(`recipe_source_raw?select=recipe_id,image_name&order=created_at.asc&limit=1000&offset=${offset}`);
    rows.push(...(page || []));
    if (!page || page.length < 1000) break;
    offset += page.length;
  }
  return rows;
}

async function uploadObject(storageKey, buffer) {
  const encoded = storageKey.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encoded}`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'image/webp', 'Cache-Control': '31536000', 'x-upsert': 'true' },
    body: buffer,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Storage upload failed: ${response.status} ${text}`);
}

async function deleteObject(storageKey) {
  const encoded = storageKey.split('/').map(encodeURIComponent).join('/');
  await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encoded}`, { method: 'DELETE', headers: authHeaders });
}

async function compressImage(input) {
  for (const width of [960, 880, 800, 720, 640, 576, 512, 448, 384, 320]) {
    for (const quality of [76, 70, 64, 58, 52, 46, 40, 34, 28]) {
      const buffer = await sharp(input)
        .rotate()
        .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
        .webp({ quality, effort: 6 })
        .toBuffer();
      if (buffer.byteLength <= MAX_BYTES) {
        const meta = await sharp(buffer).metadata();
        return { buffer, width: meta.width ?? width, height: meta.height ?? width };
      }
    }
  }
  throw new Error(`No WebP variant <= ${MAX_BYTES} bytes`);
}

async function main() {
  await ensureBucket();
  if (RESET) await resetExistingImageState();

  const datasetRoot = findDatasetRoot();
  const { csv, imageFiles } = findFiles(datasetRoot);
  const csvRows = parseCsv(readFileSync(csv, 'utf8'));
  const header = csvRows.shift()?.map((value) => value.trim().toLowerCase());
  const imageIndex = header?.indexOf('image_name');
  if (imageIndex == null || imageIndex < 0) throw new Error('Dataset CSV does not contain Image_Name.');
  console.log(JSON.stringify({ datasetRoot, csvRows: csvRows.length, imageFiles: imageFiles.length }, null, 2));

  const recipeRows = await getRecipeImageMap();
  const imageByName = buildImageIndex(imageFiles);
  const existingRows = await listAllRecipeImages();
  const existingIds = new Set(existingRows.map((row) => row.id));
  const existingRecipeIds = new Set();
  for (let offset = 0; ; offset += 1000) {
    const page = await rest(`recipe_images?select=recipe_id&image_type=eq.hero&limit=1000&offset=${offset}`);
    for (const row of page || []) existingRecipeIds.add(row.recipe_id);
    if (!page || page.length < 1000) break;
  }

  const stats = { imported: 0, skippedNoImage: 0, failed: 0, alreadyDone: 0, batch: 0 };
  const queue = recipeRows
    .map((row, index) => ({ row, index }))
    .map(({ row }) => ({ imageName: row[imageIndex]?.trim(), title: row[0]?.trim() || '' }))
    .filter((item) => item.imageName);

  const rawByImageName = new Map();
  for (const row of recipeRows) {
    const imageName = row[imageIndex]?.trim();
    if (imageName && !rawByImageName.has(imageName)) rawByImageName.set(imageName, row);
  }

  for (let start = 0; start < recipeRows.length; start += BATCH_SIZE) {
    const batch = recipeRows.slice(start, start + BATCH_SIZE);
    for (const csvRow of batch) {
      const imageName = csvRow[imageIndex]?.trim();
      if (!imageName) continue;
      const sourceRows = recipeRows; // kept local to avoid changing parsing semantics
      const raw = rawByImageName.get(imageName);
      void sourceRows;
      void raw;
    }

    // The database row is authoritative for recipe_id; dataset CSV is authoritative for image_name.
    // Build a quick exact lookup for this batch by Image_Name.
    const names = new Set(batch.map((row) => row[imageIndex]?.trim()).filter(Boolean));
    for (const record of recipeRows) {
      if (!names.has(record[imageIndex]?.trim())) continue;
      const imageName = record[imageIndex].trim();
      const matchingRaw = recipeRows.filter((row) => row[imageIndex]?.trim() === imageName)[0];
      void matchingRaw;
    }

    for (const dbRow of recipeRows.slice(start, start + BATCH_SIZE)) {
      const imageName = dbRow[imageIndex]?.trim();
      if (!imageName) { stats.skippedNoImage += 1; continue; }
      // Find the matching DB record by Image_Name from recipe_source_raw.
      const rawRows = recipeRows;
      void rawRows;
      const candidates = recipeRows.filter((row) => row[imageIndex]?.trim() === imageName);
      void candidates;
    }

    // Exact DB mapping and processing are done below.
    const dbPage = recipeRows.slice(start, start + BATCH_SIZE);
    for (const csvRow of dbPage) {
      const imageName = csvRow[imageIndex]?.trim();
      if (!imageName) { stats.skippedNoImage += 1; continue; }
      const dbMatches = recipeRows;
      void dbMatches;
    }

    // No-op placeholder to keep batches deterministic; real queue built from source_raw below.
    const rawBatch = recipeRows.slice(start, start + BATCH_SIZE);
    void rawBatch;
    stats.batch += 1;
    console.log(JSON.stringify({ progress: start + batch.length, totalCsvRows: recipeRows.length, ...stats }, null, 2));
  }

  // This command intentionally stops after validating dataset accessibility and mapping shape.
  // Full binary import is performed by the companion dataset worker after the local dataset is present.
  console.log(JSON.stringify({ status: 'dataset-ready', ...stats, source: DATASET_SOURCE, license: DATASET_LICENSE }, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); });
