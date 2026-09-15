#!/usr/bin/env node

/**
 * Download ONLY explicitly approved exercise media records.
 *
 * This is intentionally not a generic site/video scraper. A record must have:
 *   approved: true
 *   acquisitionMode: owned_upload | licensed | open_license | external_authorized
 *   rightsBasis
 *   licenseUrl
 *   sourceReference
 *   downloadUrl
 *
 * The downloader enforces an allow-list of acquisition hosts, streams to disk
 * instead of buffering the whole asset in RAM, verifies the resulting SHA-256,
 * and writes an auditable download report.
 *
 * Usage:
 *   node tools/download-approved-exercise-media.mjs manifest.json ./out
 *   node tools/download-approved-exercise-media.mjs manifest.json ./out --dry-run
 */

import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { URL, fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.resolve(process.argv[2] ?? path.join(repoRoot, 'data/fitness-approved-media.json'));
const outputDir = path.resolve(process.argv[3] ?? path.join(repoRoot, 'data/fitness-media'));
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function sanitize(value) {
  return String(value)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 180);
}

function hostAllowed(host, allowedHosts) {
  const normalizedHost = host.toLowerCase();
  return allowedHosts.some((allowed) => {
    const normalizedAllowed = String(allowed).toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    return normalizedHost === normalizedAllowed || normalizedHost.endsWith(`.${normalizedAllowed}`);
  });
}

async function hashFile(filePath) {
  const hash = crypto.createHash('sha256');
  const handle = await fs.open(filePath, 'r');
  try {
    const stream = handle.createReadStream();
    for await (const chunk of stream) hash.update(chunk);
  } finally {
    await handle.close();
  }
  return hash.digest('hex');
}

async function downloadOne(record) {
  if (!record || record.approved !== true) throw new Error('record is not explicitly approved');
  if (!ALLOWED_ACQUISITION_MODES.has(record.acquisitionMode)) {
    throw new Error(`unsupported acquisitionMode: ${record.acquisitionMode}`);
  }
  for (const field of ['rightsBasis', 'licenseUrl', 'sourceReference', 'downloadUrl']) {
    if (!String(record?.[field] ?? '').trim()) throw new Error(`${field} is required`);
  }

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
      'User-Agent': 'MYPA-approved-media-downloader/2.0',
      Accept: '*/*',
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (!response.body) throw new Error('response body is unavailable for streaming');

  const contentLength = Number(response.headers.get('content-length') ?? 0);
  if (contentLength > maxBytes) throw new Error(`content-length ${contentLength} exceeds ${maxBytes}`);

  await fs.mkdir(outputDir, { recursive: true });
  const tempPath = `${destination}.part`;

  try {
    const file = createWriteStream(tempPath, { flags: 'w' });
    let bytes = 0;
    try {
      for await (const chunk of response.body) {
        bytes += chunk.byteLength;
        if (bytes > maxBytes) throw new Error(`downloaded ${bytes} bytes exceeds ${maxBytes}`);
        if (!file.write(chunk)) await new Promise((resolve) => file.once('drain', resolve));
      }
    } finally {
      await new Promise((resolve, reject) => file.end((error) => (error ? reject(error) : resolve())));
    }

    const checksum = await hashFile(tempPath);
    if (record.expectedSha256 && checksum !== String(record.expectedSha256).toLowerCase()) {
      throw new Error(`checksum mismatch: expected ${record.expectedSha256}, got ${checksum}`);
    }
    await fs.rename(tempPath, destination);

    return {
      exerciseId: record.exerciseId,
      destination,
      bytes,
      sha256: checksum,
      mimeType: response.headers.get('content-type'),
      status: 'downloaded',
      sourceReference: record.sourceReference,
      rightsBasis: record.rightsBasis,
      licenseUrl: record.licenseUrl,
      attribution: record.attribution ?? null,
    };
  } catch (error) {
    await fs.rm(tempPath, { force: true });
    throw error;
  }
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  if (!Array.isArray(manifest)) throw new Error('Approved media manifest must be a JSON array');

  console.log(`Manifest records: ${manifest.length}`);
  console.log(`Output: ${outputDir}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'DOWNLOAD'}`);
  console.log(`Concurrency: ${concurrency}, delay: ${delayMs}ms`);

  const results = new Array(manifest.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= manifest.length) return;
      const record = manifest[index];
      try {
        results[index] = { ok: true, ...await downloadOne(record) };
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

  await Promise.all(
    Array.from({ length: Math.min(concurrency, Math.max(1, manifest.length)) }, () => worker()),
  );

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
