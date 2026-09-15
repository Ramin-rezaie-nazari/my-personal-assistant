#!/usr/bin/env node

/**
 * Run the next zero-cost fitness video discovery lane against only the current gaps.
 *
 * Flow:
 *   completion report -> gap query list -> discovered source inventory -> asset extraction
 *   -> rights review -> gap coverage report.
 *
 * Discovery and rights review never silently approve third-party media.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const toolsDir = path.join(repoRoot, 'tools');
const dataDir = path.join(repoRoot, 'data');

const completionPath = path.join(dataDir, 'fitness-1500-video-completion.generated.json');
const seedInventoryPath = path.join(dataDir, 'fitness-media-source-inventory.seed.json');
const searchDiscoveryPath = path.join(dataDir, 'fitness-media-1000-source-discovery.search.generated.json');
const sourceInventoryPath = path.join(dataDir, 'fitness-media-source-inventory.generated.json');
const gapQueriesPath = path.join(dataDir, 'fitness-1494-gap-video-queries.generated.json');
const assetCandidatesPath = path.join(dataDir, 'fitness-1494-gap-video-asset-candidates.generated.json');
const rightsReviewPath = path.join(dataDir, 'fitness-1494-gap-video-rights-review.generated.json');
const outputPath = path.join(dataDir, 'fitness-1494-gap-discovery-completion.generated.json');

const assetConcurrency = Math.max(1, Number(process.env.FITNESS_MEDIA_ASSET_CONCURRENCY ?? 3));
const maxSources = Math.max(1, Number(process.env.FITNESS_MEDIA_ASSET_MAX_SOURCES ?? 250));
const rightsConcurrency = Math.max(1, Number(process.env.FITNESS_MEDIA_RIGHTS_CONCURRENCY ?? 3));

function run(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: 'inherit',
      env: { ...process.env, ...env },
    });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`)));
  });
}

const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));

const completion = await readJson(completionPath);
const missingExercises = Array.isArray(completion?.missingExercises) ? completion.missingExercises : [];
if (Number(completion?.canonicalExerciseCount) !== 1500) {
  throw new Error(`Expected canonicalExerciseCount=1500; found ${completion?.canonicalExerciseCount}`);
}

await fs.writeFile(gapQueriesPath, `${JSON.stringify(missingExercises.map((exercise) => ({
  exerciseId: exercise.exerciseId,
  name: exercise.name,
})), null, 2)}\n`, 'utf8');
console.log(`Gap queries: ${missingExercises.length}`);

if (!await fileExists(sourceInventoryPath)) {
  if (!await fileExists(searchDiscoveryPath)) {
    console.log('=== SOURCE DISCOVERY: SEARCH ENGINE FALLBACK ===');
    await run(process.execPath, [path.join(toolsDir, 'discover-fitness-1000-sources-search.mjs'), seedInventoryPath, searchDiscoveryPath]);
  }
  console.log('=== SOURCE INVENTORY: MERGE ===');
  await run(process.execPath, [path.join(toolsDir, 'merge-fitness-source-discovery.mjs'), seedInventoryPath, searchDiscoveryPath, sourceInventoryPath]);
}

console.log('=== GAP LANE: ASSET DISCOVERY ===');
await run(process.execPath, [path.join(toolsDir, 'discover-fitness-video-assets-from-sources.mjs'), sourceInventoryPath, assetCandidatesPath, gapQueriesPath], {
  FITNESS_MEDIA_ASSET_MAX_SOURCES: String(maxSources),
  FITNESS_MEDIA_ASSET_CONCURRENCY: String(assetConcurrency),
});

console.log('=== GAP LANE: RIGHTS REVIEW ===');
await run(process.execPath, [path.join(toolsDir, 'review-fitness-video-rights.mjs'), assetCandidatesPath, rightsReviewPath], {
  FITNESS_MEDIA_RIGHTS_CONCURRENCY: String(rightsConcurrency),
});

const rights = await readJson(rightsReviewPath);
const records = Array.isArray(rights?.results) ? rights.results : [];
const approvedLike = records.filter((row) => ['cc0', 'cc-by', 'public-domain'].includes(row?.licenseClass) && row?.exactMatch && row?.mediaUrl && row?.sourceUrl);
const exerciseIds = new Set(missingExercises.map((exercise) => exercise.exerciseId));
const rightsQualifiedExercises = new Set(approvedLike.map((row) => row.exerciseId).filter((id) => exerciseIds.has(id)));

const output = {
  generatedAt: new Date().toISOString(),
  canonicalExerciseCount: 1500,
  startingApprovedCoverage: Number(completion?.approvedOpenVideoCoverage ?? completion?.approvedOpenVideoCount ?? 0),
  gapExerciseCount: missingExercises.length,
  candidateCount: Number(rights?.reviewed ?? records.length),
  rightsQualifiedExactCandidates: approvedLike.length,
  gapExercisesWithRightsQualifiedExactCandidate: rightsQualifiedExercises.size,
  note: 'This is a discovery/rights evidence report. It does not mutate approved media. Exact asset rights must still satisfy the MYPA manifest and technical validation contract before approval.',
};

await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Gap exercises with rights-qualified exact candidate: ${rightsQualifiedExercises.size}/${missingExercises.length}`);
console.log(`Wrote ${outputPath}`);

async function fileExists(file) {
  try { await fs.access(file); return true; } catch { return false; }
}
