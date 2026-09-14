#!/usr/bin/env node

/**
 * Download ONLY explicitly approved exercise media records.
 *
 * This is intentionally not a generic site/video scraper. A record must have:
 *   approved: true
 *   acquisitionMode: owned_upload | licensed | open_license | external_authorized
 *   rightsBasis
 *   sourceReference
 *   downloadUrl
 *
 * The downloader also enforces an allow-list of acquisition hosts to make
 * accidental third-party blanket downloading harder.
 *
 * Usage:
 *   node tools/download-approved-exercise-media.mjs manifest.json ./out
 *   node tools/download-approved-exercise-media.mjs manifest.json ./out --dry-run
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { URL } from 'node:url';

const manifestPath = path.resolve(process.argv[2] ?? 'data/fitness-approved-media.json');
const outputDir = path.resolve(process.argv[3] ?? 'data/fitness-media');
const dryRun = process.argv.includes('--dry-run');
const concurrency = Math.max(1, Number(process.env.APPROVED_MEDIA_CONCURRENCY ?? 2));
const maxBytes = Number(process.env.APPROVED_MEDIA_MAX_BYTES ?? 250 * 1024 * 1024);
const delayMs = Math.max(0, Number(process.env.APPROVED_MEDIA_DELAY_MS ?? 500));

const ALLOWED_ACQUISITION_MODES = new Set([
  'owned_upload',
  'licensed',
  'open_license',
  'external_authorized',
]);

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function sanitize(value) {
  return String(value)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 180);
}

function hostAllowed(host, allowedHosts) {
  return allowedHosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadOne(record) {
  if (!record || record.approved !== true) {
    throw new Error('record is not explicitly approved');
  }
  if (!ALLOWED_ACQUISITION_MODES.has(record.acquisitionMode)) {
    throw new Error(`unsupported acquisitionMode: ${record.acquisitionMode}`);
  }
  if (!record.rightsBasis?.trim()) throw new Error('rightsBasis is required');
  if (!record.sourceReference?.trim()) throw new Error('sourceReference is required');
  if (!record.downloadUrl?.trim()) throw new Error('downloadUrl is required');

  const url = new URL(record.downloadUrl);
  const allowedHosts = Array.isArray(record.allowedHosts) ? record.allowedHosts : [];
  if (!allowedHosts.length || !hostAllowed(url.hostname, allowedHosts)) {
    throw new Error(`download host ${url.hostname} is not allow-listed for this record`);
  }

  const filename = sanitize(record.filename ?? `${record.exerciseId}-${path.basename(url.pathname) || 'media'}`);
  const destination = path.join(outputDir, filename);

  if (dryRun) {
    return {
      exerciseId: record.exerciseId,
      destination,
      downloadUrl: record.downloadUrl,
      status: 'dry_run',
    };
  }

  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'MYPA-approved-media-downloader/1.0',
      Accept: '*/*',
    },
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const contentLength = Number(response.headers.get('content-length') ?? 0);
  if (contentLength > maxBytes) throw new Error(`content-length ${contentLength} exceeds ${maxBytes}`);

  const body = await response.arrayBuffer();
  const buffer = Buffer.from(body);
  if (buffer.length > maxBytes) throw new Error(`downloaded ${buffer.length} bytes exceeds ${maxBytes}`);

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(destination, buffer, { flag: 'wx' }).catch(async (error) => {
    if (error?.code === 'EEXIST') {
      const existing = await fs.readFile(destination);
      if (sha256(existing) !== sha256(buffer)) {
        throw new Error(`destination exists with different checksum: ${destination}`);
      }
      return;
    }
    throw error;
  });

  return {
    exerciseId: record.exerciseId,
    destination,
    bytes: buffer.length,
    sha256: sha256(buffer),
    mimeType: response.headers.get('content-type'),
    status: 'downloaded',
    sourceReference: record.sourceReference,
    rightsBasis: record.rightsBasis,
    attribution: record.attribution ?? null,
  };
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  if (!Array.isArray(manifest)) throw new Error('Approved media manifest must be a JSON array');

  console.log(`Manifest records: ${manifest.length}`);
  console.log(`Output: ${outputDir}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'DOWNLOAD'}`);
  console.log(`Concurrency: ${concurrency}, delay: ${delayMs}ms`);

  const results = [];
  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= manifest.length) return;
      const record = manifest[index];
      try {
        const result = await downloadOne(record);
        results[index] = { ok: true, ...result };
        console.log(`[${index + 1}/${manifest.length}] OK ${record.exerciseId}`);
      } catch (error) {
        results[index] = {
          ok: false,
          exerciseId: record?.exerciseId ?? null,
          error: error instanceof Error ? error.message : String(error),
        };
        console.error(`[${index + 1}/${manifest.length}] BLOCKED ${record?.exerciseId ?? 'unknown'}: ${results[index].error}`);
      }
      await sleep(delayMs);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(1, manifest.length)) }, () => worker()));

  const report = {
    generatedAt: new Date().toISOString(),
    manifestPath,
    outputDir,
    dryRun,
    total: results.length,
    downloaded: results.filter((item) => item?.status === 'downloaded').length,
    dryRunCount: results.filter((item) => item?.status === 'dry_run').length,
    blocked: results.filter((item) => item?.ok === false).length,
    results,
  };

  const reportPath = path.join(outputDir, 'download-report.json');
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`\nReport: ${reportPath}`);
}

await main();
