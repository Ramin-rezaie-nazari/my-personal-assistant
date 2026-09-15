#!/usr/bin/env node

/** Build a resumable one-row-per-exercise media acquisition queue. */

import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const inputPath = path.resolve(process.argv[2] ?? path.join(repoRoot, 'data/fitness-canonical-exercises-1500.generated.json'));
const outputPath = path.resolve(process.argv[3] ?? path.join(repoRoot, 'data/fitness-video-acquisition-queue-1500.generated.json'));
const batchSize = Math.max(1, Number(process.env.FITNESS_MEDIA_BATCH_SIZE ?? 50));

const input = JSON.parse(await fs.readFile(inputPath, 'utf8'));
if (!Array.isArray(input?.exercises)) throw new Error('Invalid canonical catalog: exercises must be an array');
if (input.exercises.length !== 1500) throw new Error(`Expected 1500 canonical exercises, received ${input.exercises.length}`);

const queue = input.exercises.map((exercise, index) => ({
  queueId: `media_${String(index + 1).padStart(4, '0')}`,
  exerciseId: exercise.id,
  exerciseSlug: exercise.slug,
  exerciseName: exercise.name,
  batch: Math.floor(index / batchSize) + 1,
  status: 'missing',
  candidateCount: 0,
  rightsQualifiedCount: 0,
  approvedCount: 0,
  acquiredCount: 0,
  validatedCount: 0,
  lastDiscoveryAt: null,
  lastRightsReviewAt: null,
  lastAcquisitionAt: null,
  lastValidationAt: null,
  selectedMediaId: null,
  notes: [],
}));

const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceCatalog: path.basename(inputPath),
  totalExercises: queue.length,
  batchSize,
  batchCount: Math.ceil(queue.length / batchSize),
  statusCounts: { missing: queue.length },
  queue,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outputPath}`);
console.log(`Queue rows: ${queue.length}`);
console.log(`Batches: ${output.batchCount} x ${batchSize} max`);
console.log('Initial status: 1500 missing');
