#!/usr/bin/env node

/**
 * Merge a generated fitness source-discovery result into a derived inventory.
 *
 * Discovery output is unverified. This script never changes a source to
 * approved/authorized and never downloads media. The derived inventory is
 * deliberately separate from the seed inventory so discovery runs remain
 * reproducible and reviewable.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const seedPath = path.resolve(process.argv[2] ?? 'data/fitness-media-source-inventory.seed.json');
const discoveryPath = path.resolve(process.argv[3] ?? 'data/fitness-media-1000-source-discovery.search.generated.json');
const outputPath = path.resolve(process.argv[4] ?? 'data/fitness-media-source-inventory.generated.json');

const registeredDomain = (url) => {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    const parts = hostname.split('.').filter(Boolean);
    if (parts.length <= 2) return hostname;
    const secondLevel = new Set([
      'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'com.au', 'net.au', 'org.au',
      'co.nz', 'co.jp', 'com.br', 'co.in', 'com.cn', 'com.sg', 'com.tr', 'com.mx',
    ]);
    const suffix = parts.slice(-2).join('.');
    return secondLevel.has(suffix) ? parts.slice(-3).join('.') : suffix;
  } catch {
    return '';
  }
};

const seed = JSON.parse(await fs.readFile(seedPath, 'utf8'));
const discovery = JSON.parse(await fs.readFile(discoveryPath, 'utf8'));
if (!Array.isArray(seed?.sources)) throw new Error('Seed inventory must contain sources[]');
if (!Array.isArray(discovery?.sources)) throw new Error('Discovery output must contain sources[]');

const sources = [...seed.sources];
const keys = new Set();
for (const source of sources) {
  const domain = registeredDomain(source?.url ?? '');
  if (domain) keys.add(domain);
}

let added = 0;
let skipped = 0;
for (const source of discovery.sources) {
  const domain = registeredDomain(source?.url ?? '');
  if (!domain || keys.has(domain)) {
    skipped += 1;
    continue;
  }
  const normalized = {
    ...source,
    status: 'discovered-unverified',
    discovery: {
      ...(source.discovery ?? {}),
      mergedFrom: path.basename(discoveryPath),
      mergedAt: new Date().toISOString(),
    },
    rightsAction: 'Discovery lead only. Verify exact asset license, creator rights, commercial use, hosting/redistribution scope, attribution and any model/trademark restrictions before approval.',
  };
  sources.push(normalized);
  keys.add(domain);
  added += 1;
}

const output = {
  ...seed,
  generatedAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString().slice(0, 10),
  targetDistinctSources: Math.max(Number(seed.targetDistinctSources ?? 0), 1000),
  sourceDiscovery: {
    mode: discovery.discoveryMode ?? 'search_engine',
    input: path.basename(discoveryPath),
    discoveredCount: Number(discovery.discoveredSourceCount ?? discovery.sources.length),
    addedCount: added,
    skippedCount: skipped,
    sourceCountBefore: seed.sources.length,
    sourceCountAfter: sources.length,
    failures: Number(discovery.failures?.length ?? 0),
  },
  sources,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

console.log('========================================');
console.log(' MYPA FITNESS SOURCE DISCOVERY MERGE');
console.log('========================================');
console.log(`Seed sources       : ${seed.sources.length}`);
console.log(`Discovery sources  : ${discovery.sources.length}`);
console.log(`New domains added  : ${added}`);
console.log(`Skipped duplicates : ${skipped}`);
console.log(`Final source count : ${sources.length}`);
console.log(`Discovery failures : ${discovery.failures?.length ?? 0}`);
console.log(`Output             : ${outputPath}`);
console.log('========================================');
