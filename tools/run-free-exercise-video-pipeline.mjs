#!/usr/bin/env node

/**
 * Free-first exercise media pipeline.
 *
 * Flow:
 *   1) discover exact Wikimedia Commons exercise-video candidates
 *   2) promote ONLY exact CC0 / CC BY / Public Domain candidates
 *   3) write an auditable approved manifest with license/source metadata
 *   4) optionally download those approved records
 *
 * This intentionally does not scrape arbitrary sites or BODINEXT.
 *
 * Usage:
 *   node tools/run-free-exercise-video-pipeline.mjs [queries.json]
 *   node tools/run-free-exercise-video-pipeline.mjs [queries.json] --download
 *   node tools/run-free-exercise-video-pipeline.mjs [queries.json] --dry-run
 *
 * Environment:
 *   COMMONS_VIDEO_CONCURRENCY=4
 *   COMMONS_VIDEO_DELAY_MS=250
 *   COMMONS_VIDEO_MAX_RESULTS=10
 *   APPROVED_MEDIA_CONCURRENCY=2
 *   APPROVED_MEDIA_DELAY_MS=500
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const queryPath = path.resolve(process.argv[2] ?? 'data/fitness-free-video-queries.sample.json');
const shouldDownload = process.argv.includes('--download');
const dryRun = process.argv.includes('--dry-run');

const candidatesPath = path.resolve('data/fitness-free-video-candidates.commons.json');
const approvedPath = path.resolve('data/fitness-approved-media.generated.json');
const outputDir = path.resolve('data/fitness-media');

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

function slug(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

function licenseUrl(candidate) {
  switch (candidate.licenseClass) {
    case 'cc0':
      return 'https://creativecommons.org/publicdomain/zero/1.0/';
    case 'cc-by':
      return 'https://creativecommons.org/licenses/by/4.0/';
    case 'public-domain':
      return 'https://creativecommons.org/publicdomain/mark/1.0/';
    default:
      return null;
  }
}

function promoteCandidate(candidate) {
  if (!candidate?.ok && candidate?.ok !== undefined) return null;
  if (!candidate?.exactMatch) return null;
  if (!['cc0', 'cc-by', 'public-domain'].includes(candidate.licenseClass)) return null;
  if (!candidate.mediaUrl || !candidate.sourceUrl) return null;
  const sourceHost = new URL(candidate.mediaUrl).hostname;

  return {
    exerciseId: candidate.exerciseId,
    filename: `${slug(candidate.exerciseId || candidate.query || candidate.title)}-${slug(candidate.title)}.webm`,
    approved: true,
    acquisitionMode: 'open_license',
    rightsBasis: candidate.license || candidate.licenseClass,
    licenseUrl: licenseUrl(candidate),
    sourceReference: candidate.sourceUrl,
    downloadUrl: candidate.mediaUrl,
    allowedHosts: [sourceHost],
    creator: candidate.creator || null,
    attribution: candidate.attributionRequired
      ? `${candidate.creator || 'Unknown creator'} — ${candidate.license || candidate.licenseClass} — ${candidate.sourceUrl}`
      : null,
    sourceProvider: 'wikimedia_commons',
    sourceSha1: candidate.sha1 || null,
    expectedMimeType: candidate.mimeType || null,
    discoveryScore: candidate.score,
  };
}

const queryInput = JSON.parse(await fs.readFile(queryPath, 'utf8'));
if (!Array.isArray(queryInput)) throw new Error('Query file must be an array');

console.log(`MYPA free-first media pipeline: ${queryInput.length} queries`);
await run('node', ['tools/discover-free-exercise-videos-commons.mjs', queryPath, candidatesPath]);

const report = JSON.parse(await fs.readFile(candidatesPath, 'utf8'));
const approved = [];
const seenExerciseIds = new Set();

for (const result of report.results ?? []) {
  if (!result?.ok) continue;
  for (const candidate of result.candidates ?? []) {
    if (!candidate?.exactMatch) continue;
    const record = promoteCandidate(candidate);
    if (!record) continue;
    if (seenExerciseIds.has(record.exerciseId)) continue;
    seenExerciseIds.add(record.exerciseId);
    approved.push(record);
    break;
  }
}

const manifest = {
  generatedAt: new Date().toISOString(),
  policy: 'Exact Wikimedia Commons match + CC0/CC BY/Public Domain asset-level metadata only. No BODINEXT mirroring and no generic third-party scraping.',
  queryPath,
  candidateReport: candidatesPath,
  approvedCount: approved.length,
  records: approved,
};

await fs.writeFile(approvedPath, `${JSON.stringify(approved, null, 2)}\n`, 'utf8');
await fs.writeFile(path.resolve('data/fitness-approved-media.generated.report.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(`Promoted ${approved.length} exact open-license assets to ${approvedPath}`);

if (shouldDownload) {
  const args = ['tools/download-approved-exercise-media.mjs', approvedPath, outputDir];
  if (dryRun) args.push('--dry-run');
  await run('node', args);
} else {
  console.log('Download not requested. Re-run with --download to fetch the generated approved manifest.');
}
