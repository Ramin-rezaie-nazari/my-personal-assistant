#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const catalogPath = path.resolve(process.argv[2] ?? 'data/mypa-exercisedb-v1/catalog.json');
const outputPath = path.resolve(process.argv[3] ?? 'data/mypa-exercise-video-discovery-v3.json');
const limit = Math.max(0, Number(process.env.EXERCISE_VIDEO_LIMIT ?? 0));
const concurrency = Math.min(3, Math.max(1, Number(process.env.EXERCISE_VIDEO_CONCURRENCY ?? 1)));
const delayMs = Math.max(1000, Number(process.env.EXERCISE_VIDEO_DELAY_MS ?? 6000));
const retryCount = Math.max(1, Number(process.env.EXERCISE_VIDEO_RETRIES ?? 5));
const userAgent = process.env.EXERCISE_VIDEO_USER_AGENT ?? 'MYPA-exercise-video-discovery/3.0 (https://github.com/Ramin-rezaie-nazari/my-personal-assistant; contact maintainer via GitHub)';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[’'`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOP = new Set([
  'exercise', 'workout', 'training', 'male', 'female', 'variation', 'improved', 'classic',
  'traditional', 'simple', 'advanced', 'style', 'strength', 'version', 'with', 'on', 'using',
  'against', 'the', 'a', 'an', 'and', 'for', 'from', 'v', 'pro', 'side', 'pointed', 'precision',
  'multiple', 'response', 'mega', 'horizontal', 'declined', 'elevated', 'floor'
]);

function coreTokens(value) {
  return normalize(value).split(' ').filter((token) => token.length >= 3 && !STOP.has(token));
}

function score(name, candidate) {
  const a = normalize(name);
  const b = normalize(candidate);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const at = new Set(coreTokens(name));
  const bt = new Set(coreTokens(candidate));
  if (!at.size || !bt.size) return 0;
  let hits = 0;
  for (const token of at) if (bt.has(token)) hits += 1;
  const overlap = hits / at.size;
  if (b.includes(a) || a.includes(b)) return Math.max(0.9, overlap);
  return overlap;
}

function queryVariants(name) {
  const n = normalize(name);
  const stripped = n
    .replace(/\b(v\.?\s*\d+|male|female|variation|improved|classic|traditional|simple|advanced|style|version|with|on|using|against)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const core = coreTokens(name).join(' ');
  return [...new Set([n, stripped, core, `${core} exercise`].filter(Boolean))];
}

async function getJson(url) {
  let lastError;
  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          'Api-User-Agent': userAgent,
          Accept: 'application/json',
        },
      });

      if (response.ok) return response.json();

      const retryAfter = Number(response.headers.get('retry-after'));
      if (response.status !== 429 && response.status !== 503) {
        throw new Error(`HTTP ${response.status}`);
      }

      const backoff = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : Math.max(5000, delayMs * Math.pow(2, attempt));
      await sleep(backoff);
      lastError = new Error(`HTTP ${response.status}; retried after ${backoff}ms`);
    } catch (error) {
      lastError = error;
      if (attempt >= retryCount) break;
      await sleep(Math.max(5000, delayMs * Math.pow(2, attempt)));
    }
  }
  throw lastError ?? new Error('Unknown request failure');
}

async function searchCommons(exercise) {
  const pages = new Map();
  const errors = [];

  // One combined MediaWiki search request per variant. We request imageinfo directly
  // so successful searches do not require a second request per result.
  for (const q of queryVariants(exercise.name)) {
    try {
      const u = new URL('https://commons.wikimedia.org/w/api.php');
      u.search = new URLSearchParams({
        action: 'query',
        format: 'json',
        generator: 'search',
        gsrsearch: q,
        gsrnamespace: '6',
        gsrlimit: '20',
        prop: 'imageinfo',
        iiprop: 'url|mime|size|width|height|extmetadata',
        iiextmetadatalanguage: 'en',
      }).toString();

      const data = await getJson(u);
      for (const page of Object.values(data?.query?.pages ?? {})) {
        if (page?.pageid) pages.set(page.pageid, page);
      }
    } catch (error) {
      errors.push(`${q}: ${error instanceof Error ? error.message : String(error)}`);
    }
    await sleep(delayMs);
  }

  const candidates = [];
  for (const page of pages.values()) {
    const info = page?.imageinfo?.[0];
    if (!info) continue;
    const title = String(page.title ?? '').replace(/^File:/i, '');
    const mime = String(info.mime ?? '').toLowerCase();
    const isVideo = mime.startsWith('video/') || /\.(webm|mp4|ogv|mov|mkv)$/i.test(title);
    if (!isVideo) continue;

    const meta = info.extmetadata ?? {};
    const description = String(meta.ImageDescription?.value ?? '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const license = String(meta.LicenseShortName?.value ?? '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const usageTerms = String(meta.UsageTerms?.value ?? '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const creator = String(meta.Artist?.value ?? '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const finalScore = Math.max(score(exercise.name, title), score(exercise.name, description));
    const licenseNorm = normalize(license);
    const open = licenseNorm.includes('cc0') ||
      licenseNorm.includes('public domain') ||
      licenseNorm.includes('cc by') ||
      licenseNorm.includes('cc-by');

    candidates.push({
      source: 'wikimedia_commons',
      title,
      url: info.url ?? null,
      sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title).replace(/%2F/g, '/')}`,
      license: license || null,
      usageTerms: usageTerms || null,
      creator: creator || null,
      mimeType: info.mime ?? null,
      width: info.width ?? null,
      height: info.height ?? null,
      score: finalScore,
      exactMatch: finalScore >= 0.9,
      rightsClass: open ? 'open-license-candidate' : 'rights-review-required',
      commercialUseExpected: open,
      attributionRequired: open && !licenseNorm.includes('cc0') && !licenseNorm.includes('public domain'),
    });
  }

  candidates.sort((a, b) => {
    const rank = (item) => (item.exactMatch ? 100 : 0) + item.score * 50 +
      (item.rightsClass === 'open-license-candidate' ? 5 : 0);
    return rank(b) - rank(a);
  });

  return { candidates: candidates.slice(0, 10), errors };
}

async function discover(exercise, index, total) {
  const result = await searchCommons(exercise);
  const best = result.candidates[0] ?? null;
  const status = best
    ? best.exactMatch && best.rightsClass === 'open-license-candidate'
      ? 'open_exact_candidate'
      : best.exactMatch
        ? 'exact_candidate_rights_review'
        : 'candidate_review'
    : 'not_found';

  return {
    exerciseId: exercise.exerciseId,
    name: exercise.name,
    status,
    bestCandidate: best,
    candidates: result.candidates,
    errors: result.errors,
    index: index + 1,
    total,
  };
}

async function mapLimit(items, worker) {
  let cursor = 0;
  const results = new Array(items.length);
  async function run() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
      const item = results[index];
      console.log(`[${index + 1}/${items.length}] ${item.name}: ${item.status}${item.bestCandidate ? ` → ${item.bestCandidate.title}` : ''}${item.errors.length ? ` (errors=${item.errors.length})` : ''}`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, run));
  return results;
}

const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
if (!Array.isArray(catalog)) throw new Error(`Catalog must be an array: ${catalogPath}`);

const exercises = catalog.filter((item) => item?.exerciseId && item?.name).slice(0, limit || undefined);
console.log(`Discovering ${exercises.length} exercises against Wikimedia Commons...`);
console.log(`Concurrency=${concurrency}, delay=${delayMs}ms, retries=${retryCount}`);
console.log(`User-Agent=${userAgent}`);

const results = await mapLimit(exercises, discover);
const counts = {
  openExactCandidates: results.filter((item) => item.status === 'open_exact_candidate').length,
  exactRightsReviewCandidates: results.filter((item) => item.status === 'exact_candidate_rights_review').length,
  candidateReview: results.filter((item) => item.status === 'candidate_review').length,
  notFound: results.filter((item) => item.status === 'not_found' && item.errors.length === 0).length,
  withErrors: results.filter((item) => item.errors.length > 0).length,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  catalogRecords: catalog.length,
  processedRecords: results.length,
  counts,
  rateLimitPolicy: 'Wikimedia API requests use identifying User-Agent, <=3 concurrency, Retry-After/backoff handling.',
  results,
}, null, 2)}\n`, 'utf8');

console.log(JSON.stringify(counts, null, 2));
console.log(`Wrote ${outputPath}`);
