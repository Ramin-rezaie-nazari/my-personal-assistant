#!/usr/bin/env node
import { access, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(process.env.MYPA_CONTENT_MIRROR_ROOT ?? path.join(process.cwd(), 'content-mirror'));
const REQUIRED = Number(process.env.CONTENT_MIRROR_REQUIRED_MEDIA ?? 4);
const MANIFEST = path.join(ROOT, 'manifest.json');

const exists = async (file) => { try { await access(file); return true; } catch { return false; } };
const bytes = async (file) => { try { return (await stat(file)).size; } catch { return 0; } };

async function main() {
  if (!(await exists(MANIFEST))) throw new Error(`Missing ${MANIFEST}. Run content:mirror first.`);
  const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
  const items = Object.values(manifest.items ?? {});
  const invalid = [];
  let totalBytes = 0;
  for (const item of items) {
    const ready = Array.isArray(item.media) ? item.media.filter((m) => m.status === 'ready' && m.localPath) : [];
    const checked = [];
    for (const media of ready) {
      const file = path.join(ROOT, media.localPath);
      const present = await exists(file);
      const size = present ? await bytes(file) : 0;
      totalBytes += size;
      checked.push(present);
    }
    if (item.completeness !== 'complete' || ready.length < REQUIRED || checked.some((x) => !x)) {
      invalid.push({ kind: item.kind, name: item.name, completeness: item.completeness, readyMedia: ready.length, requiredMedia: REQUIRED, missingLocalFiles: checked.filter((x) => !x).length });
    }
  }
  const recipes = items.filter((x) => x.kind === 'recipe');
  const fitness = items.filter((x) => x.kind === 'fitness');
  const summary = {
    root: ROOT,
    requiredMediaPerItem: REQUIRED,
    recipeItems: recipes.length,
    recipeComplete: recipes.filter((x) => !invalid.some((y) => y.kind === 'recipe' && y.name === x.name)).length,
    fitnessItems: fitness.length,
    fitnessComplete: fitness.filter((x) => !invalid.some((y) => y.kind === 'fitness' && y.name === x.name)).length,
    invalidItems: invalid.length,
    totalMediaFiles: items.reduce((n, x) => n + (Array.isArray(x.media) ? x.media.filter((m) => m.status === 'ready').length : 0), 0),
    totalBytes,
    complete: items.length > 0 && invalid.length === 0,
    invalid: invalid.slice(0, 500),
  };
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.complete) process.exitCode = 2;
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
