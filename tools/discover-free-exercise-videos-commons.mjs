#!/usr/bin/env node

/**
 * Discover exercise demonstration videos on Wikimedia Commons with asset-level
 * license metadata. This is discovery only; it never approves media for MYPA.
 *
 * Usage:
 *   node tools/discover-free-exercise-videos-commons.mjs [queries.json] [output.json]
 *
 * queries.json can be either ["squat", "bench press"] or
 * [{"exerciseId":"...","name":"squat"}, ...].
 *
 * Environment:
 *   COMMONS_VIDEO_CONCURRENCY=1
 *   COMMONS_VIDEO_DELAY_MS=1500
 *   COMMONS_VIDEO_REQUEST_GAP_MS=1500
 *   COMMONS_VIDEO_MAX_RESULTS=10
 *   COMMONS_VIDEO_MAX_RETRIES=5
 *   COMMONS_VIDEO_RETRY_BASE_MS=5000
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const queryPath = path.resolve(process.argv[2] ?? 'data/fitness-free-video-queries.sample.json');
const outputPath = path.resolve(process.argv[3] ?? 'data/fitness-free-video-candidates.commons.json');
const checkpointPath = path.resolve(process.env.COMMONS_VIDEO_CHECKPOINT ?? `${outputPath}.checkpoint.json`);
const concurrency = Math.max(1, Number(process.env.COMMONS_VIDEO_CONCURRENCY ?? 1));
const delayMs = Math.max(250, Number(process.env.COMMONS_VIDEO_DELAY_MS ?? 1500));
const requestGapMs = Math.max(500, Number(process.env.COMMONS_VIDEO_REQUEST_GAP_MS ?? 1500));
const maxResults = Math.max(1, Number(process.env.COMMONS_VIDEO_MAX_RESULTS ?? 10));
const maxRetries = Math.max(0, Number(process.env.COMMONS_VIDEO_MAX_RETRIES ?? 5));
const retryBaseMs = Math.max(1000, Number(process.env.COMMONS_VIDEO_RETRY_BASE_MS ?? 5000));
const checkpointEvery = Math.max(1, Number(process.env.COMMONS_VIDEO_CHECKPOINT_EVERY ?? 10));

const LICENSE_CLASS = {
  cc0: 'cc0',
  'cc by': 'cc-by',
  'cc by-sa': 'cc-by-sa',
  'public domain': 'public-domain',
};

function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[’'`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value) {
  return normalize(value).split(' ').filter((token) => token.length >= 2);
}

function scoreMatch(query, candidate) {
  const a = new Set(tokens(query));
  const b = new Set(tokens(candidate));
  if (!a.size || !b.size) return 0;
  if (normalize(query) === normalize(candidate)) return 1;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / a.size;
}

function classifyLicense(name) {
  const normalized = normalize(name);
  if (normalized.includes('cc0') || normalized.includes('creative commons zero')) return LICENSE_CLASS.cc0;
  if (normalized.includes('cc by-sa') || normalized.includes('cc by sa')) return LICENSE_CLASS['cc by-sa'];
  if (normalized.includes('cc by')) return LICENSE_CLASS['cc by'];
  if (normalized.includes('public domain')) return LICENSE_CLASS['public domain'];
  return 'rights-review-required';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let nextRequestAt = 0;
let requestChain = Promise.resolve();
async function acquireRequestSlot() {
  let turn;
  turn = requestChain.then(async () => {
    const waitMs = Math.max(0, nextRequestAt - Date.now());
    if (waitMs) await sleep(waitMs);
    nextRequestAt = Date.now() + requestGapMs;
  });
  requestChain = turn.catch(() => {});
  await turn;
}

function retryAfterMs(response, attempt) {
  const header = response.headers.get('retry-after');
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds)) return Math.max(1000, seconds * 1000);
    const at = Date.parse(header);
    if (Number.isFinite(at)) return Math.max(1000, at - Date.now());
  }
  return retryBaseMs * (2 ** attempt) + Math.floor(Math.random() * 500);
}

async function getJson(url) {
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    await acquireRequestSlot();
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MYPA-free-exercise-discovery/1.0 (research; contact project maintainer)',
        Accept: 'application/json',
      },
    });

    if (response.ok) return response.json();

    const transient = response.status === 408 || response.status === 429 || response.status >= 500;
    if (!transient || attempt >= maxRetries) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }

    const waitMs = retryAfterMs(response, attempt);
    console.warn(`Commons HTTP ${response.status}; retry ${attempt + 1}/${maxRetries} in ${waitMs}ms`);
    await sleep(waitMs);
  }
  throw new Error(`Unreachable request failure for ${url}`);
}

async function searchCommons(record) {
  const query = `${record.name} exercise`;
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: String(maxResults),
    prop: 'imageinfo',
    iiprop: 'url|mime|size|sha1|extmetadata',
    iiextmetadatalanguage: 'en',
  }).toString();

  const data = await getJson(url);
  const pages = Object.values(data?.query?.pages ?? {});
  const candidates = [];

  for (const page of pages) {
    const info = page?.imageinfo?.[0];
    const metadata = info?.extmetadata ?? {};
    const mime = String(info?.mime ?? '').toLowerCase();
    const title = String(page?.title ?? '').replace(/^File:/i, '');
    const description = String(metadata.ImageDescription?.value ?? '').replace(/<[^>]*>/g, '').trim();
    const license = String(metadata.LicenseShortName?.value ?? '').replace(/<[^>]*>/g, '').trim();
    const usageTerms = String(metadata.UsageTerms?.value ?? '').replace(/<[^>]*>/g, '').trim();
    const creator = String(metadata.Artist?.value ?? '').replace(/<[^>]*>/g, '').trim();
    const isVideo = mime.startsWith('video/') || /\.(webm|mp4|ogv|mov|m4v)$/i.test(title);
    if (!isVideo || !info?.url) continue;

    const score = Math.max(scoreMatch(record.name, title), scoreMatch(record.name, description));
    const licenseClass = classifyLicense(license);
    const productionEligibleClass = licenseClass === 'cc0' || licenseClass === 'cc-by' || licenseClass === 'public-domain';

    candidates.push({
      exerciseId: record.exerciseId ?? null,
      query: record.name,
      title,
      sourceProvider: 'wikimedia_commons',
      sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title).replace(/%2F/g, '/')}`,
      mediaUrl: info.url,
      mimeType: info.mime ?? null,
      bytes: Number(info.size ?? 0) || null,
      sha1: info.sha1 ?? null,
      license,
      licenseClass,
      usageTerms: usageTerms || null,
      creator: creator || null,
      score,
      exactMatch: score >= 0.9,
      attributionRequired: licenseClass === 'cc-by' || licenseClass === 'cc-by-sa',
      candidateStatus: productionEligibleClass && score >= 0.9
        ? 'open-exact-candidate'
        : licenseClass === 'cc-by-sa'
          ? 'sharealike-review'
          : score >= 0.9
            ? 'exact-rights-review'
            : 'candidate-review',
      approvalRequired: true,
    });
  }

  return candidates.sort((a, b) => b.score - a.score);
}

async function writeCheckpoint(results, records, nextIndex, startedAt) {
  const flat = results.filter(Boolean);
  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'wikimedia_commons',
    queryCount: records.length,
    completedCount: flat.length,
    nextIndex,
    startedAt,
    resumed: nextIndex > 0,
    results,
  };
  await fs.mkdir(path.dirname(checkpointPath), { recursive: true });
  await fs.writeFile(checkpointPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function loadCheckpoint(records) {
  try {
    const saved = JSON.parse(await fs.readFile(checkpointPath, 'utf8'));
    if (saved?.queryCount !== records.length || !Array.isArray(saved?.results)) return null;
    return saved;
  } catch {
    return null;
  }
}

async function mapLimit(items, worker, initialResults = []) {
  const results = new Array(items.length).fill(null);
  for (const [index, result] of initialResults.entries()) results[index] = result;
  let cursor = initialResults.length;
  let completedSinceCheckpoint = 0;
  const startedAt = Date.now();

  async function runner() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      try {
        const candidates = await worker(items[index]);
        results[index] = { ok: true, candidates };
      } catch (error) {
        results[index] = {
          ok: false,
          exerciseId: items[index].exerciseId ?? null,
          query: items[index].name,
          candidates: [],
          error: error instanceof Error ? error.message : String(error),
        };
      }
      await sleep(delayMs);
      const row = results[index];
      const processed = results.filter(Boolean).length;
      const elapsed = Math.max(1, (Date.now() - startedAt) / 1000);
      const rate = processed / elapsed;
      const etaSeconds = rate > 0 ? Math.max(0, (items.length - processed) / rate) : 0;
      console.log(`[${processed}/${items.length}] ${items[index].name}: ${row.ok ? `${row.candidates.length} candidates` : `ERROR (${row.error})`} | rate ${rate.toFixed(2)}/s | ETA ${Math.round(etaSeconds)}s`);
      completedSinceCheckpoint += 1;
      if (completedSinceCheckpoint >= checkpointEvery) {
        await writeCheckpoint(results, items, processed, startedAt);
        completedSinceCheckpoint = 0;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(1, items.length)) }, () => runner()));
  return results;
}

const input = JSON.parse(await fs.readFile(queryPath, 'utf8'));
if (!Array.isArray(input)) throw new Error('Query file must be an array');
const records = input.map((item) => typeof item === 'string' ? { name: item } : item).filter((item) => item?.name);

const checkpoint = await loadCheckpoint(records);
const resumeCount = checkpoint ? Number(checkpoint.nextIndex ?? 0) : 0;

console.log(`Commons free-video discovery: ${records.length} exercise queries`);
console.log(`Rate-limit policy: concurrency=${concurrency}, requestGap=${requestGapMs}ms, delay=${delayMs}ms, retries=${maxRetries}`);
console.log(resumeCount ? `Resuming from checkpoint: ${resumeCount}/${records.length}` : 'Starting fresh discovery');
const initialResults = checkpoint ? checkpoint.results.map((result, index) => index < resumeCount ? result : null) : [];
const results = await mapLimit(records, searchCommons, initialResults.filter(Boolean));

const flat = results.flatMap((result) => result?.ok ? result.candidates : []);
const report = {
  generatedAt: new Date().toISOString(),
  source: 'wikimedia_commons',
  queries: records.length,
  candidates: flat.length,
  openExactCandidates: flat.filter((item) => item.candidateStatus === 'open-exact-candidate').length,
  sharealikeReview: flat.filter((item) => item.candidateStatus === 'sharealike-review').length,
  exactRightsReview: flat.filter((item) => item.candidateStatus === 'exact-rights-review').length,
  discoveryErrors: results.filter((item) => !item?.ok).length,
  note: 'Discovery only. Exact file license, attribution, creator/source provenance and MYPA distribution/storage rights must be reviewed before approval. Never auto-approve candidates.',
  results,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
await fs.rm(checkpointPath, { force: true });
console.log(`Wrote ${outputPath}`);
