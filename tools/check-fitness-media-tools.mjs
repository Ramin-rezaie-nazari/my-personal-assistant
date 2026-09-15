#!/usr/bin/env node

/** Lightweight syntax/fixture guard for the fitness media toolchain. */

import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const jsTools = [
  'tools/discover-free-exercise-videos-commons.mjs',
  'tools/discover-fitness-media-federated.mjs',
  'tools/discover-fitness-1000-sources.mjs',
  'tools/discover-fitness-1000-sources-search.mjs',
  'tools/merge-fitness-source-discovery.mjs',
  'tools/discover-fitness-video-assets-from-sources.mjs',
  'tools/review-fitness-video-rights.mjs',
];

for (const file of jsTools) {
  await execFileAsync(process.execPath, ['--check', file]);
  console.log(`✓ syntax ${file}`);
}

const jsonFixtures = [
  'data/fitness-free-video-queries.sample.json',
  'data/fitness-media-source-inventory.seed.json',
];

for (const file of jsonFixtures) {
  const parsed = JSON.parse(await fs.readFile(file, 'utf8'));
  if (file.endsWith('fitness-free-video-queries.sample.json') && !Array.isArray(parsed)) {
    throw new Error(`${file}: expected an array`);
  }
  if (file.endsWith('fitness-media-source-inventory.seed.json') && !Array.isArray(parsed?.sources)) {
    throw new Error(`${file}: expected { sources: [] }`);
  }
  console.log(`✓ json ${file}`);
}
