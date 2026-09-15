#!/usr/bin/env node

/**
 * Master 1,500-exercise video pipeline.
 *
 * Flow: canonical catalog -> acquisition queue -> Wikimedia exact discovery
 * -> rights-safe open-license promotion -> coverage report -> optional download.
 * Anything not satisfied by the free/open lane remains explicitly unresolved;
 * this script never invents rights or marks third-party assets as approved.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const toolsDir = path.join(repoRoot, 'tools');
const dataDir = path.join(repoRoot, 'data');
const catalogPath = path.join(dataDir, 'fitness-canonical-exercises-1500.generated.json');
const queuePath = path.join(dataDir, 'fitness-video-acquisition-queue-1500.generated.json');
const commonsQueryPath = path.join(dataDir, 'fitness-1500-commons-queries.generated.json');
const commonsCandidatesPath = path.join(dataDir, 'fitness-1500-video-candidates.commons.json');
const approvedPath = path.join(dataDir, 'fitness-1500-approved-video-manifest.generated.json');
const reportPath = path.join(dataDir, 'fitness-1500-video-completion.generated.json');
const shouldDownload = process.argv.includes('--download');
const batchSize = Math.max(1, Number(process.env.FITNESS_MEDIA_BATCH_SIZE ?? 50));

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

async function exists(file) {
  try { await fs.access(file); return true; } catch { return false; }
}

async function ensureCatalogAndQueue() {
  if (!await exists(catalogPath)) {
    console.log('=== PHASE 0: BUILD CANONICAL 1500 ===');
    await run(process.execPath, [path.join(toolsDir, 'build-fitness-canonical-1500.mjs')]);
  } else {
    const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
    console.log(`Canonical catalog present: ${catalog.canonicalExerciseCount ?? catalog.exercises?.length}/1500`);
  }

  if (!await exists(queuePath)) {
    console.log('=== PHASE 1: BUILD 1500 ACQUISITION QUEUE ===');
    await run(process.execPath, [path.join(toolsDir, 'build-fitness-video-acquisition-queue.mjs'), catalogPath, queuePath], {
      FITNESS_MEDIA_BATCH_SIZE: String(batchSize),
    });
  } else {
    const queue = JSON.parse(await fs.readFile(queuePath, 'utf8'));
    console.log(`Acquisition queue present: ${queue.totalExercises ?? queue.queue?.length}/1500 rows`);
  }
}

function promoteCandidate(candidate) {
  if (!candidate?.exactMatch || !candidate.exerciseId || !candidate.mediaUrl || !candidate.sourceUrl) return null;
  if (!['cc0', 'cc-by', 'public-domain'].includes(candidate.licenseClass)) return null;
  let host;
  try { host = new URL(candidate.mediaUrl).hostname; } catch { return null; }
  const license = String(candidate.license ?? candidate.licenseClass);
  const licenseUrl = candidate.licenseClass === 'cc0'
    ? 'https://creativecommons.org/publicdomain/zero/1.0/'
    : candidate.licenseClass === 'cc-by'
      ? 'https://creativecommons.org/licenses/by/4.0/'
      : candidate.sourceUrl;
  return {
    exerciseId: candidate.exerciseId,
    exerciseName: candidate.query,
    approved: true,
    acquisitionMode: 'open_license',
    rightsBasis: license,
    licenseUrl,
    sourceReference: candidate.sourceUrl,
    downloadUrl: candidate.mediaUrl,
    allowedHosts: [host],
    creator: candidate.creator || null,
    attribution: candidate.attributionRequired ? `${candidate.creator || 'Unknown creator'} — ${license} — ${candidate.sourceUrl}` : null,
    sourceProvider: 'wikimedia_commons',
    sourceSha1: candidate.sha1 || null,
    expectedMimeType: candidate.mimeType || null,
    discoveryScore: candidate.score,
  };
}

await ensureCatalogAndQueue();

const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
const exercises = Array.isArray(catalog.exercises) ? catalog.exercises : [];
if (exercises.length !== 1500) throw new Error(`Canonical catalog must contain exactly 1500 exercises; found ${exercises.length}`);

await fs.writeFile(commonsQueryPath, `${JSON.stringify(exercises.map((exercise) => ({
  exerciseId: exercise.id,
  name: exercise.name,
})), null, 2)}\n`, 'utf8');
console.log(`Wrote ${commonsQueryPath}`);

console.log('=== PHASE 2: 1500-EXERCISE FREE-FIRST VIDEO DISCOVERY ===');
await run(process.execPath, [path.join(toolsDir, 'discover-free-exercise-videos-commons.mjs'), commonsQueryPath, commonsCandidatesPath], {
  COMMONS_VIDEO_CONCURRENCY: process.env.COMMONS_VIDEO_CONCURRENCY ?? '2',
  COMMONS_VIDEO_DELAY_MS: process.env.COMMONS_VIDEO_DELAY_MS ?? '400',
  COMMONS_VIDEO_MAX_RESULTS: process.env.COMMONS_VIDEO_MAX_RESULTS ?? '10',
});

const candidateReport = JSON.parse(await fs.readFile(commonsCandidatesPath, 'utf8'));
const bestByExercise = new Map();
for (const result of candidateReport.results ?? []) {
  if (!result?.ok) continue;
  for (const candidate of result.candidates ?? []) {
    const promoted = promoteCandidate(candidate);
    if (!promoted) continue;
    const current = bestByExercise.get(promoted.exerciseId);
    if (!current || (promoted.discoveryScore ?? 0) > (current.discoveryScore ?? 0)) bestByExercise.set(promoted.exerciseId, promoted);
  }
}

const approved = [...bestByExercise.values()];
await fs.writeFile(approvedPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  catalog: path.basename(catalogPath),
  policy: 'Exact Wikimedia Commons match with CC0, CC BY or Public Domain evidence. Approval remains bounded by the exact file record and manifest validation.',
  count: approved.length,
  records: approved,
}, null, 2)}\n`, 'utf8');

console.log('=== PHASE 3: COVERAGE GATE ===');
const exerciseIds = new Set(exercises.map((exercise) => exercise.id));
const covered = [...bestByExercise.keys()].filter((id) => exerciseIds.has(id)).length;
const missing = exercises.filter((exercise) => !bestByExercise.has(exercise.id)).map((exercise) => ({ exerciseId: exercise.id, name: exercise.name }));
const completion = {
  generatedAt: new Date().toISOString(),
  canonicalExerciseCount: exercises.length,
  candidateQueryCount: candidateReport.queries ?? 0,
  discoveryErrorCount: candidateReport.discoveryErrors ?? 0,
  approvedOpenVideoCount: approved.length,
  approvedOpenVideoCoverage: covered,
  approvedOpenVideoCoverageRate: Number(((covered / exercises.length) * 100).toFixed(1)),
  missingApprovedVideoCount: missing.length,
  missingExercises: missing,
  nextLane: missing.length ? 'free-only-gap-closure-required' : 'complete-open-lane',
  greenGate: (exercises.length === 1500 && covered === 1500),
};
await fs.writeFile(reportPath, `${JSON.stringify(completion, null, 2)}\n`, 'utf8');
console.log(`Approved free/open videos: ${covered}/${exercises.length}`);
console.log(`Missing approved videos: ${missing.length}`);
console.log(`Discovery errors: ${completion.discoveryErrorCount}`);
console.log(`GREEN 1500/1500 gate: ${completion.greenGate ? 'YES' : 'NO'}`);
console.log(`Completion report: ${reportPath}`);

if (shouldDownload && approved.length) {
  console.log('=== PHASE 4: DOWNLOAD APPROVED FREE/OPEN MEDIA ===');
  await run(process.execPath, [path.join(toolsDir, 'download-approved-exercise-media.mjs'), approvedPath, path.join(dataDir, 'fitness-media')]);
} else {
  console.log('Download not requested; no media files were fetched by this master runner.');
}
