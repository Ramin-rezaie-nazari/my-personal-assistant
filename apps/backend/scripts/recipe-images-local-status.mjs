import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(process.env.RECIPE_LOCAL_ROOT || './data/mypa-recipe-media-local');
const MANIFEST = path.join(ROOT, 'manifest', 'recipe-heroes.jsonl');
const FAILURE = path.join(ROOT, 'manifest', 'failures.jsonl');
const SUMMARY = path.join(ROOT, 'manifest', 'summary.json');

async function readJsonl(file) {
  try {
    const text = await fs.readFile(file, 'utf8');
    return text.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

const manifest = await readJsonl(MANIFEST);
const latest = new Map();
for (const row of manifest) if (row.recipeId) latest.set(String(row.recipeId), row);

const counts = { complete: 0, failed: 0, needs_reprocess: 0, other: 0 };
const resolvers = {};
for (const row of latest.values()) {
  if (row.status === 'complete') counts.complete += 1;
  else if (row.status === 'failed') counts.failed += 1;
  else if (row.status === 'needs_reprocess') counts.needs_reprocess += 1;
  else counts.other += 1;
  if (row.status === 'complete') resolvers[row.resolver || 'unknown'] = (resolvers[row.resolver || 'unknown'] || 0) + 1;
}

let summary = null;
try { summary = JSON.parse(await fs.readFile(SUMMARY, 'utf8')); } catch {}
const failures = await readJsonl(FAILURE);
console.log(JSON.stringify({
  root: ROOT,
  manifestRows: manifest.length,
  uniqueRecipes: latest.size,
  counts,
  completeByResolver: resolvers,
  failureLogRows: failures.length,
  lastRun: summary,
}, null, 2));
