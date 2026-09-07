import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(process.env.RECIPE_LOCAL_ROOT || './data/mypa-recipe-media');
const IMAGE_ROOT = path.join(ROOT, 'images', 'recipes');
const CATALOG_PATH = path.join(ROOT, 'recipe-catalog.jsonl');
const MAX_BYTES = 60 * 1024;

async function readCatalog() {
  const text = await fs.readFile(CATALOG_PATH, 'utf8');
  return text.split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

async function main() {
  const recipes = await readCatalog();
  const failures = [];
  const seenHashes = new Map();
  let valid = 0;

  for (const recipe of recipes) {
    const file = path.join(IMAGE_ROOT, String(recipe.recipeId), 'hero.webp');
    try {
      const body = await fs.readFile(file);
      const meta = await sharp(body, { failOn: 'none' }).metadata();
      if (meta.format !== 'webp') throw new Error(`format=${meta.format || 'unknown'}`);
      if (body.byteLength > MAX_BYTES) throw new Error(`bytes=${body.byteLength}`);
      if (!meta.width || !meta.height || meta.width < 220 || meta.height < 220) {
        throw new Error(`dimensions=${meta.width || 0}x${meta.height || 0}`);
      }
      const ratio = meta.width / meta.height;
      if (ratio < 0.35 || ratio > 3) throw new Error(`aspect=${ratio.toFixed(2)}`);
      valid += 1;
    } catch (error) {
      failures.push({ recipeId: recipe.recipeId, name: recipe.name, reason: error instanceof Error ? error.message : String(error) });
    }
  }

  let files = 0;
  try {
    for (const recipe of recipes) {
      const file = path.join(IMAGE_ROOT, String(recipe.recipeId), 'hero.webp');
      const body = await fs.readFile(file);
      const hash = await import('node:crypto').then(({ createHash }) => createHash('sha256').update(body).digest('hex'));
      files += 1;
      if (seenHashes.has(hash)) seenHashes.get(hash).push(recipe.recipeId);
      else seenHashes.set(hash, [recipe.recipeId]);
    }
  } catch {}

  const duplicateContent = [...seenHashes.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([sha256, recipeIds]) => ({ sha256, recipeIds }));

  const summary = {
    checkedAt: new Date().toISOString(),
    recipes: recipes.length,
    valid,
    missingOrInvalid: failures.length,
    heroFiles: files,
    duplicateContentGroups: duplicateContent.length,
    duplicateContent,
    status: failures.length === 0 && files === recipes.length ? 'complete' : 'incomplete',
    failures,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (failures.length || files !== recipes.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
