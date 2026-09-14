#!/usr/bin/env node

/**
 * Discover candidate exercise demonstration videos for the local ExerciseDB catalog.
 *
 * Sources:
 *  - Wikimedia Commons (public API, license metadata inspected per file)
 *  - Pexels (optional PEXELS_API_KEY; platform license, commercial use allowed subject to terms)
 *  - Pixabay (optional PIXABAY_API_KEY; platform content license, commercial use subject to terms)
 *
 * This tool NEVER marks third-party media as production-approved. It writes a rights-aware
 * candidate report so a human/content policy layer can approve exact matches.
 *
 * Usage:
 *   node tools/discover-exercise-videos.mjs [catalog.json] [output.json]
 *
 * Optional env:
 *   PEXELS_API_KEY=...
 *   PIXABAY_API_KEY=...
 *   EXERCISE_VIDEO_CONCURRENCY=4
 *   EXERCISE_VIDEO_DELAY_MS=150
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const catalogPath = path.resolve(process.argv[2] ?? 'data/mypa-exercisedb-v1/catalog.json');
const outputPath = path.resolve(process.argv[3] ?? 'data/mypa-exercise-video-discovery.json');
const concurrency = Number(process.env.EXERCISE_VIDEO_CONCURRENCY ?? 4);
const delayMs = Number(process.env.EXERCISE_VIDEO_DELAY_MS ?? 150);

const pexelsKey = process.env.PEXELS_API_KEY?.trim();
const pixabayKey = process.env.PIXABAY_API_KEY?.trim();

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

function tokens(value) {
  return normalize(value).split(' ').filter((token) => token.length >= 3);
}

function overlapScore(name, candidate) {
  const a = new Set(tokens(name));
  const b = new Set(tokens(candidate));
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / a.size;
}

function exactness(name, candidate) {
  const a = normalize(name);
  const b = normalize(candidate);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (b.includes(a) || a.includes(b)) return 0.9;
  const score = overlapScore(a, b);
  return score >= 0.8 ? score : score * 0.75;
}

function escapeWikimediaSearch(query) {
  return query.replace(/["']/g, ' ').replace(/\s+/g, ' ').trim();
}

async function getJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'User-Agent': 'MYPA-exercise-video-discovery/1.0 (content research)',
      Accept: 'application/json',
      ...(options.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

async function searchCommons(exercise) {
  const query = escapeWikimediaSearch(`"${exercise.name}" exercise`);
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: '10',
    prop: 'imageinfo',
    iiprop: 'url|mime|size|extmetadata',
    iiextmetadatalanguage: 'en',
  }).toString();

  const data = await getJson(url);
  const pages = Object.values(data?.query?.pages ?? {});
  const results = [];

  for (const page of pages) {
    const info = page.imageinfo?.[0];
    const meta = info?.extmetadata ?? {};
    const license = String(meta.LicenseShortName?.value ?? '').trim();
    const usageTerms = String(meta.UsageTerms?.value ?? '').replace(/<[^>]*>/g, '').trim();
    const description = String(meta.ImageDescription?.value ?? '').replace(/<[^>]*>/g, '').trim();
    const title = String(page.title ?? '').replace(/^File:/i, '');
    const mime = String(info?.mime ?? '').toLowerCase();

    const isVideo = mime.startsWith('video/') || /\.(webm|mp4|ogv|mov)$/i.test(title);
    if (!isVideo) continue;

    const licenseNorm = normalize(license);
    const freelyLicensed =
      licenseNorm.includes('cc0') ||
      licenseNorm.includes('cc by ') ||
      licenseNorm.includes('cc by sa') ||
      licenseNorm.includes('public domain');

    const score = Math.max(
      exactness(exercise.name, title),
      exactness(exercise.name, description),
    );

    results.push({
      source: 'wikimedia_commons',
      title,
      url: info?.url ?? null,
      sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title).replace(/%2F/g, '/')}`,
      license: license || null,
      usageTerms: usageTerms || null,
      creator: String(meta.Artist?.value ?? '').replace(/<[^>]*>/g, '').trim() || null,
      mimeType: info?.mime ?? null,
      score,
      exactMatch: score >= 0.9,
      rightsClass: freelyLicensed ? 'open-license-candidate' : 'rights-review-required',
      commercialUseExpected: freelyLicensed,
      attributionRequired: freelyLicensed && !licenseNorm.includes('cc0') && !licenseNorm.includes('public domain'),
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}

async function searchPexels(exercise) {
  if (!pexelsKey) return [];
  const url = new URL('https://api.pexels.com/v1/videos/search');
  url.search = new URLSearchParams({
    query: `${exercise.name} exercise demonstration`,
    per_page: '15',
  }).toString();

  const data = await getJson(url, { headers: { Authorization: pexelsKey } });
  return (data?.videos ?? []).map((video) => {
    const score = exactness(exercise.name, `${video.url} ${video.user?.name ?? ''}`);
    const file = [...(video.video_files ?? [])]
      .filter((candidate) => candidate.file_type === 'video/mp4')
      .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];
    return {
      source: 'pexels',
      title: `${exercise.name} / Pexels candidate`,
      url: file?.link ?? null,
      sourceUrl: video.url ?? null,
      license: 'Pexels License',
      usageTerms: 'Commercial use allowed under Pexels License; not for standalone redistribution.',
      creator: video.user?.name ?? null,
      mimeType: file?.file_type ?? null,
      width: file?.width ?? null,
      height: file?.height ?? null,
      score,
      exactMatch: false,
      rightsClass: 'platform-license-candidate',
      commercialUseExpected: true,
      attributionRequired: false,
      attributionRecommended: true,
      reviewRequired: true,
    };
  }).sort((a, b) => b.score - a.score).slice(0, 5);
}

async function searchPixabay(exercise) {
  if (!pixabayKey) return [];
  const url = new URL('https://pixabay.com/api/videos/');
  url.search = new URLSearchParams({
    key: pixabayKey,
    q: `${exercise.name} exercise`,
    per_page: '15',
    safesearch: 'true',
    video_type: 'film',
  }).toString();

  const data = await getJson(url);
  return (data?.hits ?? []).map((video) => {
    const largest = Object.values(video.videos ?? {})
      .filter((candidate) => candidate?.url)
      .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];
    const score = exactness(exercise.name, `${video.tags ?? ''} ${video.pageURL ?? ''}`);
    return {
      source: 'pixabay',
      title: video.tags ?? `${exercise.name} / Pixabay candidate`,
      url: largest?.url ?? null,
      sourceUrl: video.pageURL ?? null,
      license: 'Pixabay Content License',
      usageTerms: 'Commercial use allowed subject to Pixabay Content License; standalone redistribution prohibited.',
      creator: video.user ?? null,
      mimeType: 'video/mp4',
      width: largest?.width ?? null,
      height: largest?.height ?? null,
      score,
      exactMatch: false,
      rightsClass: 'platform-license-candidate',
      commercialUseExpected: true,
      attributionRequired: false,
      attributionRecommended: true,
      reviewRequired: true,
    };
  }).sort((a, b) => b.score - a.score).slice(0, 5);
}

async function discoverOne(exercise, index, total) {
  const candidates = [];
  const errors = [];

  for (const [name, fn] of [
    ['wikimedia_commons', () => searchCommons(exercise)],
    ['pexels', () => searchPexels(exercise)],
    ['pixabay', () => searchPixabay(exercise)],
  ]) {
    try {
      candidates.push(...(await fn()));
    } catch (error) {
      errors.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
    await sleep(delayMs);
  }

  candidates.sort((a, b) => {
    const rights = (candidate) =>
      candidate.rightsClass === 'open-license-candidate' ? 2 :
      candidate.rightsClass === 'platform-license-candidate' ? 1 : 0;
    return (b.exactMatch ? 100 : 0) + b.score * 50 + rights(b) * 5 - ((a.exactMatch ? 100 : 0) + a.score * 50 + rights(a) * 5);
  });

  const best = candidates[0] ?? null;
  return {
    exerciseId: exercise.exerciseId,
    name: exercise.name,
    bestCandidate: best,
    candidates: candidates.slice(0, 12),
    status: best
      ? best.exactMatch && best.rightsClass === 'open-license-candidate'
        ? 'open_exact_candidate'
        : best.exactMatch
          ? 'exact_candidate_rights_review'
          : 'candidate_review'
      : 'not_found',
    errors,
    permissionSearchQuery: `"${exercise.name}" exercise video permission reuse commercial license`,
    index: index + 1,
    total,
  };
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function runner() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
      const item = results[index];
      console.log(`[${index + 1}/${items.length}] ${item.name}: ${item.status}${item.bestCandidate ? ` → ${item.bestCandidate.source}` : ''}`);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, limit) }, () => runner()));
  return results;
}

const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
if (!Array.isArray(catalog)) throw new Error(`Catalog must be a JSON array: ${catalogPath}`);

const exercises = catalog.map((record) => ({
  exerciseId: record.exerciseId,
  name: record.name,
})).filter((record) => record.exerciseId && record.name);

console.log(`Discovering videos for ${exercises.length} exercises...`);
console.log(`Wikimedia Commons: enabled`);
console.log(`Pexels: ${pexelsKey ? 'enabled' : 'disabled (set PEXELS_API_KEY)'}`);
console.log(`Pixabay: ${pixabayKey ? 'enabled' : 'disabled (set PIXABAY_API_KEY)'}`);
console.log(`Concurrency=${concurrency}, delay=${delayMs}ms`);

const results = await mapLimit(exercises, concurrency, (exercise, index) => discoverOne(exercise, index, exercises.length));

const summary = {
  generatedAt: new Date().toISOString(),
  catalogRecords: exercises.length,
  sources: {
    wikimediaCommons: true,
    pexels: Boolean(pexelsKey),
    pixabay: Boolean(pixabayKey),
  },
  counts: {
    openExactCandidates: results.filter((item) => item.status === 'open_exact_candidate').length,
    exactRightsReviewCandidates: results.filter((item) => item.status === 'exact_candidate_rights_review').length,
    candidateReview: results.filter((item) => item.status === 'candidate_review').length,
    notFound: results.filter((item) => item.status === 'not_found').length,
  },
  note: 'Discovery candidates only. Human/content-policy approval is required before production ingestion. Do not treat platform-license candidates as standalone media redistribution permission.',
  results,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(`\nWrote ${outputPath}`);
console.log(JSON.stringify(summary.counts, null, 2));
