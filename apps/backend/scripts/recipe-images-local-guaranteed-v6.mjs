import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const LOCAL_ROOT = path.resolve(process.env.RECIPE_LOCAL_ROOT || './data/mypa-recipe-media-local');
const CATALOG = path.resolve(process.env.RECIPE_LOCAL_CATALOG || './data/mypa-recipe-media/recipe-catalog.jsonl');
const IMAGE_ROOT = path.join(LOCAL_ROOT, 'images', 'recipes');
const MANIFEST_DIR = path.join(LOCAL_ROOT, 'manifest');
const MANIFEST_PATH = path.join(MANIFEST_DIR, 'recipe-heroes.jsonl');
const DATASET_ROOT_CANDIDATES = [
  process.env.RECIPE_LOCAL_DATASET_DIR,
  path.resolve('./recipe-image-dataset'),
  path.resolve('./archive'),
  path.resolve('./Food Images'),
  path.resolve('./data/recipe-image-dataset'),
  path.resolve('./data/mypa-recipe-media-dataset'),
].filter(Boolean);

const steps = [];
const env = {
  RECIPE_LOCAL_ROOT: LOCAL_ROOT,
  RECIPE_LOCAL_CATALOG: CATALOG,
  RECIPE_LOCAL_CONCURRENCY: process.env.RECIPE_LOCAL_CONCURRENCY || '4',
  RECIPE_LOCAL_DELAY_MS: process.env.RECIPE_LOCAL_DELAY_MS || '450',
  RECIPE_LOCAL_LIMIT: process.env.RECIPE_LOCAL_LIMIT || '0',
  RECIPE_LOCAL_FORCE: '0',
  RECIPE_LOCAL_AUDIT_EXISTING: '1',
};

const exists = (p) => { try { fsSync.accessSync(p); return true; } catch { return false; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function findLocalDatasetRoot() {
  for (const candidate of DATASET_ROOT_CANDIDATES) if (exists(candidate)) return candidate;
  return null;
}

async function loadCatalogIds() {
  if (!exists(CATALOG)) throw new Error(`Local recipe catalog not found: ${CATALOG}`);
  const text = await fs.readFile(CATALOG, 'utf8');
  const recipes = [];
  const seen = new Set();
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const r = JSON.parse(line);
      const id = String(r.recipeId || r.id || '').trim();
      const name = String(r.name || r.recipeName || '').trim();
      if (id && name && !seen.has(id)) { seen.add(id); recipes.push({ id, name }); }
    } catch {}
  }
  return recipes;
}

async function loadManifest() {
  try {
    const text = await fs.readFile(MANIFEST_PATH, 'utf8');
    const map = new Map();
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) continue;
      try { const row = JSON.parse(line); if (row.recipeId) map.set(String(row.recipeId), row); } catch {}
    }
    return map;
  } catch (e) { if (e.code === 'ENOENT') return new Map(); throw e; }
}

async function append(row) {
  await fs.mkdir(MANIFEST_DIR, { recursive: true });
  await fs.appendFile(MANIFEST_PATH, `${JSON.stringify(row)}\n`);
}

async function runNode(name, script, customEnv = {}, allowFailure = false) {
  console.log(`\n========== ${name} ==========`);
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], { cwd: ROOT, stdio: 'inherit', env: { ...process.env, ...env, ...customEnv } });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0 || allowFailure) return resolve({ code, signal });
      reject(new Error(`${name} exited with code=${code ?? 'null'} signal=${signal ?? 'null'}`));
    });
  });
}

async function mirrorKnownLocalDataset() {
  const datasetRoot = await findLocalDatasetRoot();
  if (!datasetRoot) {
    console.log(JSON.stringify({ localDataset: null, action: 'skip', reason: 'No local recipe image dataset directory found' }, null, 2));
    return;
  }
  console.log(JSON.stringify({ localDataset: datasetRoot, action: 'discover' }, null, 2));
  const recipes = await loadCatalogIds();
  const manifest = await loadManifest();

  const files = [];
  const stack = [datasetRoot];
  const exts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
  while (stack.length) {
    const dir = stack.pop();
    for (const name of await fs.readdir(dir)) {
      const full = path.join(dir, name);
      const stat = await fs.stat(full);
      if (stat.isDirectory()) stack.push(full);
      else if (exts.has(path.extname(name).toLowerCase())) files.push({ name, full });
    }
  }

  const byStem = new Map();
  for (const file of files) {
    const stem = file.name.slice(0, -path.extname(file.name).length).toLowerCase();
    byStem.set(file.name.toLowerCase(), file.full);
    byStem.set(stem, file.full);
  }

  let imported = 0;
  for (const recipe of recipes) {
    const existing = manifest.get(recipe.id);
    if (existing?.status === 'complete' && existing.resolver === 'exact-local-dataset') continue;
    const candidates = [
      recipe.id,
      recipe.id.toLowerCase(),
      recipe.name,
      recipe.name.toLowerCase(),
      recipe.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    ];
    const file = candidates.map((x) => byStem.get(String(x).toLowerCase())).find(Boolean);
    if (!file) continue;
    const target = path.join(IMAGE_ROOT, recipe.id, 'hero.webp');
    try {
      const packed = await (async () => {
        const sharp = (await import('sharp')).default;
        const input = await fs.readFile(file);
        const source = await sharp(input, { failOn: 'none' }).rotate().metadata();
        if (Math.min(Number(source.width || 0), Number(source.height || 0)) < 640) throw new Error('source resolution below 640px');
        let best = null;
        for (const width of [1200,1080,960,880,800,720,640]) {
          for (const quality of [90,84,78,72,66,60,54,48,42,36,30,24,18,12,8,4]) {
            const output = await sharp(input, { failOn: 'none' }).rotate().resize({ width, fit: 'inside', withoutEnlargement: true }).webp({ quality, effort: 6 }).toBuffer();
            const meta = await sharp(output).metadata();
            const result = { output, width:Number(meta.width||width), height:Number(meta.height||width), bytes:output.length, quality };
            if (!best || result.bytes < best.bytes) best = result;
            if (result.width >= 640 && result.height >= 640 && result.bytes >= 20480 && result.bytes <= 153600) return result;
          }
        }
        throw new Error(`no WebP <= 150KB; smallest=${best?.bytes ?? 'none'}`);
      })();
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, packed.output);
      await append({ recipeId:recipe.id, recipeName:recipe.name, status:'complete', resolver:'exact-local-dataset', sourceType:'local-dataset', sourcePageUrl:null, sourceImageUrl:file, sourceWidth:null, sourceHeight:null, width:packed.width, height:packed.height, bytes:packed.bytes, quality:packed.quality, localPath:path.relative(LOCAL_ROOT,target), generatedAt:new Date().toISOString() });
      manifest.set(recipe.id, { recipeId:recipe.id, status:'complete', resolver:'exact-local-dataset' });
      imported += 1;
    } catch (error) {
      console.error(`[LOCAL DATASET SKIP] ${recipe.id} ${recipe.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  console.log(JSON.stringify({ localDataset: datasetRoot, imported }, null, 2));
}

async function main() {
  console.log(JSON.stringify({ pipeline:'recipe-images-local-guaranteed-v6', supabase:'DISABLED', strategy:['local audit','local exact dataset when available','strict verified web fallback','local final status'] }, null, 2));
  await runNode('audit-existing-local', './scripts/recipe-images-local-audit-v4.mjs');
  await mirrorKnownLocalDataset();
  await runNode('strict-verified-web-resolution', './scripts/recipe-images-local-strict-v3.mjs', { RECIPE_LOCAL_AUDIT_EXISTING:'0' }, true);
  await runNode('final-status', './scripts/recipe-images-local-status.mjs');
  console.log('\nPIPELINE COMPLETE');
}

main().catch((e) => { console.error(`\nPIPELINE FAILED: ${e instanceof Error ? e.message : String(e)}`); process.exit(1); });
