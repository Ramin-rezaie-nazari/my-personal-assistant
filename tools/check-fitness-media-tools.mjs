#!/usr/bin/env node

/** Lightweight syntax/fixture guard for the fitness media toolchain. */

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const jsTools = [
  'tools/discover-free-exercise-videos-commons.mjs',
  'tools/discover-fitness-media-federated.mjs',
  'tools/discover-fitness-1000-sources.mjs',
  'tools/discover-fitness-1000-sources-search.mjs',
  'tools/merge-fitness-source-discovery.mjs',
  'tools/discover-fitness-video-assets-from-sources.mjs',
  'tools/review-fitness-video-rights.mjs',
  'tools/summarize-fitness-media-coverage.mjs',
];

for (const relativePath of jsTools) {
  const file = path.join(repoRoot, relativePath);
  await execFileAsync(process.execPath, ['--check', file], { cwd: repoRoot });
  console.log(`✓ syntax ${relativePath}`);
}

const jsonFixtures = [
  'data/fitness-free-video-queries.sample.json',
  'data/fitness-media-source-inventory.seed.json',
];

for (const relativePath of jsonFixtures) {
  const file = path.join(repoRoot, relativePath);
  const parsed = JSON.parse(await fs.readFile(file, 'utf8'));
  if (relativePath.endsWith('fitness-free-video-queries.sample.json') && !Array.isArray(parsed)) {
    throw new Error(`${relativePath}: expected an array`);
  }
  if (relativePath.endsWith('fitness-media-source-inventory.seed.json') && !Array.isArray(parsed?.sources)) {
    throw new Error(`${relativePath}: expected { sources: [] }`);
  }
  console.log(`✓ json ${relativePath}`);
}
