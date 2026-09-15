#!/usr/bin/env node

/**
 * Build explicit zero-cost gap queues from the 1,500 video completion report.
 *
 * Paths are repo-rooted so this tool behaves consistently from any cwd.
 * This tool never treats a queue row as a video. Third-party candidates remain
 * discovery/rights work, while self-production rows require an actual project-
 * owned media asset before they can become approved.
 *
 * Usage:
 *   node tools/build-fitness-video-gap-queues.mjs [completion-report] [gap-queue] [self-production-queue]
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resolveRepoPath = (value, fallback) => path.resolve(repoRoot, value ?? fallback);

const completionPath = resolveRepoPath(process.argv[2], 'data/fitness-1500-video-completion.generated.json');
const gapQueuePath = resolveRepoPath(process.argv[3], 'data/fitness-1500-video-gap-queue.generated.json');
const selfProductionPath = resolveRepoPath(process.argv[4], 'data/fitness-1500-video-self-production.queue.generated.json');

const completion = JSON.parse(await fs.readFile(completionPath, 'utf8'));
const exercises = Array.isArray(completion?.missingExercises) ? completion.missingExercises : [];
const generatedAt = new Date().toISOString();

const gapQueue = {
  generatedAt,
  sourceCompletionReport: path.relative(repoRoot, completionPath),
  canonicalExerciseCount: Number(completion?.canonicalExerciseCount ?? 0),
  approvedOpenVideoCount: Number(completion?.approvedOpenVideoCount ?? 0),
  missingCount: exercises.length,
  policy: 'Zero-cost only. Rows are work items, not approval records. External media requires exact asset-level rights; self-production requires a real project-controlled media file.',
  rows: exercises.map((exercise, index) => ({
    sequence: index + 1,
    exerciseId: exercise.exerciseId,
    exerciseName: exercise.name,
    status: 'discovery-gap',
    freeOpenDiscoveryRequired: true,
    rightsReviewRequired: true,
    selfProductionFallbackRequired: true,
  })),
};

const selfProductionQueue = {
  generatedAt,
  sourceGapQueue: path.relative(repoRoot, gapQueuePath),
  canonicalExerciseCount: Number(completion?.canonicalExerciseCount ?? 0),
  requiredCount: exercises.length,
  statusMeaning: 'queued means the exercise still lacks an approved usable video; it does not mean a video exists.',
  rows: exercises.map((exercise, index) => ({
    sequence: index + 1,
    exerciseId: exercise.exerciseId,
    exerciseName: exercise.name,
    status: 'self-production-required',
    mediaExists: false,
    approved: false,
    provenanceRequired: true,
    technicalValidationRequired: true,
  })),
};

await fs.mkdir(path.dirname(gapQueuePath), { recursive: true });
await fs.writeFile(gapQueuePath, `${JSON.stringify(gapQueue, null, 2)}\n`, 'utf8');
await fs.writeFile(selfProductionPath, `${JSON.stringify(selfProductionQueue, null, 2)}\n`, 'utf8');

console.log(`Gap queue: ${gapQueue.rows.length} exercises`);
console.log(`Self-production queue: ${selfProductionQueue.rows.length} exercises`);
console.log(`Wrote ${gapQueuePath}`);
console.log(`Wrote ${selfProductionPath}`);
