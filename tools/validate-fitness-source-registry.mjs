#!/usr/bin/env node

/**
 * Validate the MYPA Fitness source registry and approved media manifest.
 *
 * This validator prevents source discovery from turning into accidental
 * permission escalation: source-level candidates never become downloadable
 * media without an explicit, asset-level approval record.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const registryPath = path.resolve(process.argv[2] ?? 'data/fitness-source-registry.seed.json');
const manifestPath = path.resolve(process.argv[3] ?? 'data/fitness-approved-media.sample.json');

const VALID_CLASSES = new Set([
  'open-license-media-archive',
  'commercial-license-video',
  'commercial-license-library',
  'commercial-license-library-api',
  'commercial-license-animation',
  'commercial-api-media',
  'commercial-in-app-exercise-data-media',
  'open-license-exercise-data',
  'stock-video-platform',
  'exercise-api-media',
  'embedding-license-lead',
  'rights-review-required',
  'exercise-data-video-marketplace',
  'open_license_media',
  'licensed_vendor',
  'licensed_dataset',
  'licensed_api_media',
  'licensed_vendor_api',
  'licensed_content_platform',
  'licensed_content_vendor',
  'licensed_animation',
  'exercise_marketplace',
  'embedding_license_lead',
  'rights_review',
  'exercise_dataset',
  'marketplace_asset',
  'stock_media_platform',
]);

function fail(message) {
  throw new Error(message);
}

function assertHttpUrl(value, label) {
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) fail(`${label} must use http/https`);
  } catch {
    fail(`${label} is not a valid URL: ${value}`);
  }
}

const registry = JSON.parse(await fs.readFile(registryPath, 'utf8'));
if (!Array.isArray(registry) || registry.length === 0) fail('source registry must be a non-empty array');

const ids = new Set();
const domains = new Set();
for (const [index, source] of registry.entries()) {
  if (!source?.id || !source?.name || !source?.url || !source?.class) fail(`registry[${index}] missing required fields`);
  if (ids.has(source.id)) fail(`duplicate source id: ${source.id}`);
  ids.add(source.id);
  assertHttpUrl(source.url, `registry[${index}].url`);
  if (!VALID_CLASSES.has(source.class)) fail(`registry[${index}] invalid class: ${source.class}`);
  domains.add(new URL(source.url).hostname.toLowerCase().replace(/^www\./, ''));
}

const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
if (!Array.isArray(manifest)) fail('approved media manifest must be an array');

let approved = 0;
for (const [index, record] of manifest.entries()) {
  if (record?.approved !== true) fail(`manifest[${index}] must have approved=true`);
  if (!['owned_upload', 'licensed', 'open_license', 'external_authorized'].includes(record.acquisitionMode)) {
    fail(`manifest[${index}] invalid acquisitionMode`);
  }
  for (const field of ['rightsBasis', 'licenseUrl', 'sourceReference', 'downloadUrl', 'filename', 'exerciseId']) {
    if (!String(record?.[field] ?? '').trim()) fail(`manifest[${index}] missing ${field}`);
  }
  for (const field of ['licenseUrl', 'sourceReference', 'downloadUrl']) {
    assertHttpUrl(record[field], `manifest[${index}].${field}`);
  }
  const allowedHosts = Array.isArray(record.allowedHosts) ? record.allowedHosts : [];
  if (!allowedHosts.length) fail(`manifest[${index}] must define allowedHosts`);
  const host = new URL(record.downloadUrl).hostname.toLowerCase();
  if (!allowedHosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) {
    fail(`manifest[${index}] download host is not allowed: ${host}`);
  }
  approved += 1;
}

console.log(`Source registry OK: ${registry.length} records / ${domains.size} unique domains`);
console.log(`Approved media manifest OK: ${approved} asset records`);
console.log('Rights escalation guard: PASS');
