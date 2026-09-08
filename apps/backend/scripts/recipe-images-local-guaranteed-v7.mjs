import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import sharp from 'sharp';

const ROOT = path.resolve(process.env.RECIPE_LOCAL_ROOT || './data/mypa-recipe-media-local');
const CATALOG = path.resolve(process.env.RECIPE_LOCAL_CATALOG || './data/mypa-recipe-media/recipe-catalog.jsonl');
const DATASET_ROOT = path.join(ROOT, 'dataset', 'epicurious-image-dataset');
const ZIP_PATH = path.join(DATASET_ROOT, 'dataset.zip');
const MIRROR_ZIP_PATH = path.join(DATASET_ROOT, 'github-mirror.zip');
const MANIFEST_DIR = path.join(ROOT, 'manifest');
const MANIFEST = path.join(MANIFEST_DIR, 'recipe-heroes.jsonl');
const DATASET_MANIFEST = path.join(MANIFEST_DIR, 'recipe-dataset-matches.jsonl');
const IMAGE_ROOT = path.join(ROOT, 'images', 'recipes');

const DATASET_URL = process.env.RECIPE_LOCAL_DATASET_URL || 'https://www.kaggle.com/api/v1/datasets/download/pes12017000148/food-ingredients-and-recipe-dataset-with-images';
const GITHUB_MIRROR_URL = process.env.RECIPE_LOCAL_DATASET_MIRROR_URL || 'https://github.com/kaveesh-kadirvel/Fridge2Fork/archive/refs/heads/main.zip';
const MIN_SIDE = 640;
const MIN_BYTES = 20 * 1024;
const MAX_BYTES = 150 * 1024;
const MAX_IMAGES = Math.min(Math.max(Number(process.env.RECIPE_LOCAL_MAX_IMAGES || '4'), 1), 4);
const PROGRESS_EVERY = Math.max(Number(process.env.RECIPE_LOCAL_DATASET_PROGRESS_EVERY || '250'), 25);

const exists = (p) => { try { fsSync.accessSync(p); return true; } catch { return false; } };
const now = () => new Date().toISOString();

function normalize(value) {
  return String(value || '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[“”‘’]/g, "'")
    .replace(/\b(recipe|recipes|food|dish|easy|best|favorite|favourite|classic|homemade|simple)\b/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sha256(buffer) { return crypto.createHash('sha256').update(buffer).digest('hex'); }

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i += 1; }
        else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (ch !== '\r') cell += ch;
  }
  row.push(cell);
  if (row.some((x) => x.length)) rows.push(row);
  return rows;
}

async function appendJsonl(file, row) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.appendFile(file, `${JSON.stringify(row)}\n`);
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    child.on('error', reject);
    child.on('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`${command} exited with code=${code ?? 'null'} signal=${signal ?? 'null'}`)));
  });
}

async function locateDatasetFiles() {
  if (!exists(DATASET_ROOT)) return null;
  const stack = [DATASET_ROOT];
  let csv = null;
  const images = [];
  const exts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
  while (stack.length) {
    const dir = stack.pop();
    for (const name of await fs.readdir(dir)) {
      const full = path.join(dir, name);
      const stat = await fs.stat(full);
      if (stat.isDirectory()) stack.push(full);
      else {
        if (/^Food Ingredients and Recipe Dataset with Image Name Mapping\.csv$/i.test(name)) csv = full;
        if (exts.has(path.extname(name).toLowerCase())) images.push({ name, full });
      }
    }
  }
  return csv ? { csv, images } : null;
}

async function cleanPartial(file) {
  try { await fs.rm(file, { force: true }); } catch {}
}

async function downloadAndExtract({ name, url, archivePath }) {
  await fs.mkdir(DATASET_ROOT, { recursive: true });
  await cleanPartial(archivePath);
  console.log(JSON.stringify({ dataset: name, action: 'download', url, localPath: archivePath }, null, 2));
  await run('curl', [
    '-L', '--fail', '--retry', '3',
    '--retry-all-errors',
    '--connect-timeout', '20',
    '--max-time', '1800',
    '-o', archivePath,
    url,
  ]);
  console.log(JSON.stringify({ dataset: name, action: 'extract', zip: archivePath }, null, 2));
  await run('unzip', ['-q', '-o', archivePath, '-d', DATASET_ROOT]);
  const located = await locateDatasetFiles();
  if (!located?.csv || !located.images.length) {
    throw new Error(`Source ${name} extracted but required CSV/images were not found`);
  }
  console.log(JSON.stringify({ dataset: 'local', source: name, csv: located.csv, images: located.images.length, action: 'ready' }, null, 2));
  return located;
}

async function ensureDataset() {
  const found = await locateDatasetFiles();
  if (found?.csv && found.images.length) {
    console.log(JSON.stringify({ dataset: 'local', csv: found.csv, images: found.images.length, action: 'reuse' }, null, 2));
    return found;
  }

  await fs.mkdir(DATASET_ROOT, { recursive: true });

  const sources = [
    { name: 'epicurious-kaggle-public', url: DATASET_URL, archivePath: ZIP_PATH },
    { name: 'epicurious-github-mirror', url: GITHUB_MIRROR_URL, archivePath: MIRROR_ZIP_PATH },
  ];
  const failures = [];

  for (const source of sources) {
    try {
      const located = await downloadAndExtract(source);
      return located;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ source: source.name, error: message });
      console.error(JSON.stringify({ dataset: source.name, action: 'failed', error: message, next: 'try-next-source' }, null, 2));
      await cleanPartial(source.archivePath);
    }
  }

  throw new Error(`All dataset sources failed: ${JSON.stringify(failures)}`);
}

async function loadCatalog() {
  if (!exists(CATALOG)) throw new Error(`Local recipe catalog not found: ${CATALOG}`);
  const rows = [];
  for (const line of (await fs.readFile(CATALOG, 'utf8')).split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const r = JSON.parse(line);
      const recipeId = String(r.recipeId || r.id || '').trim();
      const name = String(r.name || r.recipeName || '').trim();
      if (recipeId && name) rows.push({ recipeId, name });
    } catch {}
  }
  return rows;
}

async function encode(input) {
  const source = await sharp(input, { failOn: 'none' }).rotate().metadata();
  if (Math.min(Number(source.width || 0), Number(source.height || 0)) < MIN_SIDE) throw new Error('source resolution below 640px');
  let best = null;
  for (const width of [1400, 1200, 1080, 960, 880, 800, 720, 640]) {
    for (const quality of [90, 84, 78, 72, 66, 60, 54, 48, 42, 36, 30, 24, 18, 12, 8, 4]) {
      const output = await sharp(input, { failOn: 'none' }).rotate().resize({ width, fit: 'inside', withoutEnlargement: true }).webp({ quality, effort: 6 }).toBuffer();
      const meta = await sharp(output).metadata();
      const result = { output, width: Number(meta.width || width), height: Number(meta.height || 0), bytes: output.length, quality };
      if (!best || Math.abs(result.bytes - 100 * 1024) < Math.abs(best.bytes - 100 * 1024)) best = result;
      if (result.width >= MIN_SIDE && result.height >= MIN_SIDE && result.bytes >= MIN_BYTES && result.bytes <= MAX_BYTES) return result;
    }
  }
  throw new Error(`no acceptable WebP <=150KB; best=${best?.bytes ?? 'none'}`);
}

async function loadDatasetMap(dataset) {
  const rows = parseCsv(await fs.readFile(dataset.csv, 'utf8'));
  if (!rows.length) throw new Error('Dataset CSV is empty');
  const header = rows[0].map((x) => normalize(x).replace(/ /g, '_'));
  const titleIdx = header.indexOf('title');
  const imageIdx = header.indexOf('image_name');
  if (titleIdx < 0 || imageIdx < 0) throw new Error(`Dataset columns missing Title/Image_Name; headers=${header.join(',')}`);

  const imageByBase = new Map();
  for (const image of dataset.images) {
    imageByBase.set(image.name.toLowerCase(), image.full);
    const stem = image.name.slice(0, -path.extname(image.name).length).toLowerCase();
    if (!imageByBase.has(stem)) imageByBase.set(stem, image.full);
  }

  const map = new Map();
  for (let i = 1; i < rows.length; i += 1) {
    const title = String(rows[i][titleIdx] || '').trim();
    const imageName = String(rows[i][imageIdx] || '').trim();
    if (!title || !imageName) continue;
    const key = normalize(title);
    const file = imageByBase.get(imageName.toLowerCase()) || imageByBase.get(imageName.replace(/\.[^.]+$/, '').toLowerCase());
    if (!key || !file) continue;
    const list = map.get(key) || [];
    list.push({ title, imageName, file });
    map.set(key, list);
  }
  return { map, datasetRows: rows.length - 1, imageCount: dataset.images.length };
}

async function loadLatestManifest() {
  try {
    const text = await fs.readFile(MANIFEST, 'utf8');
    const map = new Map();
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) continue;
      try { const r = JSON.parse(line); if (r.recipeId) map.set(String(r.recipeId), r); } catch {}
    }
    return map;
  } catch (e) { if (e.code === 'ENOENT') return new Map(); throw e; }
}

async function main() {
  await fs.mkdir(MANIFEST_DIR, { recursive: true });
  await fs.mkdir(IMAGE_ROOT, { recursive: true });
  const dataset = await ensureDataset();
  const catalog = await loadCatalog();
  const { map, datasetRows, imageCount } = await loadDatasetMap(dataset);
  const existing = await loadLatestManifest();
  console.log(JSON.stringify({ pipeline: 'recipe-images-local-guaranteed-v7', supabase: 'DISABLED', catalogRecipes: catalog.length, datasetRows, datasetImages: imageCount, exactTitleIndex: map.size, targetImagesPerRecipe: `1-${MAX_IMAGES}` }, null, 2));

  let matched = 0;
  let ambiguous = 0;
  let skippedExisting = 0;
  let processed = 0;
  for (const recipe of catalog) {
    const prior = existing.get(recipe.recipeId);
    if (prior?.status === 'complete' && prior?.localPath && exists(path.resolve(ROOT, prior.localPath))) {
      skippedExisting += 1;
      continue;
    }
    const candidates = map.get(normalize(recipe.name)) || [];
    if (candidates.length !== 1) {
      if (candidates.length > 1) ambiguous += 1;
      continue;
    }
    const source = candidates[0];
    try {
      const input = await fs.readFile(source.file);
      const packed = await encode(input);
      const dir = path.join(IMAGE_ROOT, recipe.recipeId);
      const hero = path.join(dir, 'hero.webp');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(hero, packed.output);
      const row = {
        recipeId: recipe.recipeId,
        recipeName: recipe.name,
        status: 'complete',
        resolver: 'exact-local-dataset-v1',
        sourceType: 'epicurious-dataset',
        sourcePageUrl: null,
        sourceImageUrl: source.file,
        matchedDatasetTitle: source.title,
        datasetImageName: source.imageName,
        width: packed.width,
        height: packed.height,
        bytes: packed.bytes,
        quality: packed.quality,
        sha256: sha256(packed.output),
        localPath: path.relative(ROOT, hero),
        galleryCount: 1,
        generatedAt: now(),
      };
      await appendJsonl(MANIFEST, row);
      await appendJsonl(DATASET_MANIFEST, { ...row, datasetCsv: dataset.csv, datasetRoot: DATASET_ROOT });
      matched += 1;
    } catch (error) {
      await appendJsonl(DATASET_MANIFEST, { recipeId: recipe.recipeId, recipeName: recipe.name, status: 'failed', reason: error instanceof Error ? error.message : String(error), datasetTitle: source.title, datasetImageName: source.imageName, generatedAt: now() });
    }
    processed += 1;
    if (processed === 1 || processed % PROGRESS_EVERY === 0) console.log(JSON.stringify({ progress: `${processed}/${catalog.length}`, matched, ambiguous, skippedExisting }, null, 2));
  }
  console.log(JSON.stringify({ status: 'complete', matched, ambiguous, skippedExisting, catalogRecipes: catalog.length, remainingForWeb: Math.max(catalog.length - matched, 0) }, null, 2));
}

main().catch((error) => { console.error(`\nDATASET STAGE FAILED: ${error instanceof Error ? error.message : String(error)}`); process.exit(1); });
