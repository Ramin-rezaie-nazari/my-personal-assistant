#!/usr/bin/env node

/**
 * Federated fitness-media discovery engine.
 *
 * The source registry is the source of truth for what may be queried. A source
 * is only machine-queryable when it declares `discovery`, and discovery never
 * implies production approval. Candidates remain rights-gated.
 *
 * Supported discovery modes:
 *   - commons_mediawiki: Wikimedia Commons MediaWiki search
 *   - web_index: a configured search-provider endpoint template supplied by the operator
 *
 * web_index intentionally does not scrape search-engine result pages. Configure
 * an approved search API/endpoint through environment variables instead.
 *
 * Usage:
 *   node tools/discover-fitness-media-federated.mjs queries.json inventory.json output.json
 *
 * Environment:
 *   FITNESS_MEDIA_SOURCE_CONCURRENCY=4
 *   FITNESS_MEDIA_QUERY_CONCURRENCY=2
 *   FITNESS_MEDIA_DELAY_MS=500
 *   FITNESS_MEDIA_MAX_RESULTS=10
 *   FITNESS_MEDIA_SEARCH_ENDPOINT=https://.../search?q={query}&site={domain}
 *
 * The search endpoint must return JSON with either `results: []` or an array.
 * Result objects may include: title, url, mediaUrl, mimeType, license,
 * licenseUrl, creator, description.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const queryPath = path.resolve(process.argv[2] ?? 'data/fitness-free-video-queries.sample.json');
const inventoryPath = path.resolve(process.argv[3] ?? 'data/fitness-media-source-inventory.seed.json');
const outputPath = path.resolve(process.argv[4] ?? 'data/fitness-federated-video-candidates.json');

const sourceConcurrency = Math.max(1, Number(process.env.FITNESS_MEDIA_SOURCE_CONCURRENCY ?? 4));
const queryConcurrency = Math.max(1, Number(process.env.FITNESS_MEDIA_QUERY_CONCURRENCY ?? 2));
const delayMs = Math.max(0, Number(process.env.FITNESS_MEDIA_DELAY_MS ?? 500));
const maxResults = Math.max(1, Number(process.env.FITNESS_MEDIA_MAX_RESULTS ?? 10));
const searchEndpoint = process.env.FITNESS_MEDIA_SEARCH_ENDPOINT ?? '';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[’'`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenScore(query, candidate) {
  const a = new Set(normalize(query).split(' ').filter((x) => x.length > 1));
  const b = new Set(normalize(candidate).split(' ').filter((x) => x.length > 1));
  if (!a.size || !b.size) return 0;
  if (normalize(query) === normalize(candidate)) return 1;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / a.size;
}

function classifyLicense(value) {
  const normalized = normalize(value);
  if (normalized.includes('cc0') || normalized.includes('creative commons zero')) return 'cc0';
  if (normalized.includes('cc by-sa') || normalized.includes('cc by sa')) return 'cc-by-sa';
  if (normalized.includes('cc by')) return 'cc-by';
  if (normalized.includes('public domain')) return 'public-domain';
  return 'rights-review-required';
}

function sourceHost(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

async function getJson(url, headers = {}) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'MYPA-federated-fitness-media-discovery/1.0',
      Accept: 'application/json',
      ...headers,
    },
  });
  if (!response.ok) {
    const retryAfter = response.headers.get('retry-after');
    const error = new Error(`HTTP ${response.status} for ${url}`);
    error.status = response.status;
    error.retryAfter = retryAfter;
    throw error;
  }
  return response.json();
}

async function discoverCommons(source, record) {
  const query = `${record.name} exercise`;
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.search = new URLSearchParams({
    action: 'query', format: 'json', generator: 'search',
    gsrsearch: query, gsrnamespace: '6', gsrlimit: String(maxResults),
    prop: 'imageinfo', iiprop: 'url|mime|size|sha1|extmetadata',
    iiextmetadatalanguage: 'en',
  }).toString();

  const data = await getJson(url);
  const pages = Object.values(data?.query?.pages ?? {});
  return pages.flatMap((page) => {
    const info = page?.imageinfo?.[0];
    if (!info?.url) return [];
    const metadata = info.extmetadata ?? {};
    const title = String(page?.title ?? '').replace(/^File:/i, '');
    const mimeType = String(info.mime ?? '').toLowerCase();
    if (!mimeType.startsWith('video/') && !/\.(webm|mp4|ogv|mov|m4v)$/i.test(title)) return [];
    const description = String(metadata.ImageDescription?.value ?? '').replace(/<[^>]*>/g, '').trim();
    const license = String(metadata.LicenseShortName?.value ?? '').replace(/<[^>]*>/g, '').trim();
    const creator = String(metadata.Artist?.value ?? '').replace(/<[^>]*>/g, '').trim();
    const licenseClass = classifyLicense(license);
    const score = Math.max(tokenScore(record.name, title), tokenScore(record.name, description));
    return [{
      sourceId: source.id,
      sourceProvider: 'wikimedia_commons',
      exerciseId: record.exerciseId ?? null,
      query: record.name,
      title,
      url: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title).replace(/%2F/g, '/')}`,
      mediaUrl: info.url,
      mimeType: info.mime ?? null,
      bytes: Number(info.size ?? 0) || null,
      sha1: info.sha1 ?? null,
      license,
      licenseClass,
      licenseUrl: null,
      creator: creator || null,
      description: description || null,
      score,
      exactMatch: score >= 0.9,
      rightsGate: ['cc0', 'cc-by', 'public-domain'].includes(licenseClass) ? 'narrow-open-license-candidate' : 'rights-review-required',
      machineApproved: false,
    }];
  });
}

function fillTemplate(template, values) {
  return template.replace(/\{(query|domain|limit)\}/g, (_, key) => encodeURIComponent(values[key] ?? ''));
}

async function discoverWebIndex(source, record) {
  if (!searchEndpoint) throw new Error('FITNESS_MEDIA_SEARCH_ENDPOINT is not configured');
  const domain = source.domain ?? source.url ? new URL(source.url).hostname : '';
  const query = `${record.name} exercise video`;
  const url = fillTemplate(searchEndpoint, { query, domain, limit: String(maxResults) });
  const data = await getJson(url);
  const rows = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
  return rows.slice(0, maxResults).map((row) => {
    const title = String(row?.title ?? row?.name ?? record.name);
    const mediaUrl = String(row?.mediaUrl ?? row?.media_url ?? row?.videoUrl ?? row?.video_url ?? row?.url ?? '');
    const sourceUrl = String(row?.url ?? mediaUrl);
    const license = String(row?.license ?? row?.licenseName ?? '');
    const licenseClass = classifyLicense(license);
    const score = Math.max(tokenScore(record.name, title), tokenScore(record.name, String(row?.description ?? '')));
    return {
      sourceId: source.id,
      sourceProvider: source.type ?? 'web_index',
      exerciseId: record.exerciseId ?? null,
      query: record.name,
      title,
      url: sourceUrl,
      mediaUrl,
      mimeType: row?.mimeType ?? row?.mime_type ?? null,
      license,
      licenseClass,
      licenseUrl: row?.licenseUrl ?? row?.license_url ?? null,
      creator: row?.creator ?? row?.author ?? null,
      description: row?.description ?? null,
      score,
      exactMatch: score >= 0.9,
      rightsGate: row?.licenseUrl && ['cc0', 'cc-by', 'public-domain'].includes(licenseClass)
        ? 'narrow-open-license-candidate'
        : 'rights-review-required',
      machineApproved: false,
    };
  });
}

async function discoverOne(source, record) {
  switch (source.discovery?.mode) {
    case 'commons_mediawiki':
      return discoverCommons(source, record);
    case 'web_index':
      return discoverWebIndex(source, record);
    default:
      return [];
  }
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function runner() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      try {
        results[index] = { ok: true, value: await worker(items[index], index) };
      } catch (error) {
        results[index] = {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
          status: error?.status ?? null,
          retryAfter: error?.retryAfter ?? null,
        };
      }
      if (delayMs) await sleep(delayMs);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, Math.max(1, items.length)) }, runner));
  return results;
}

const queries = JSON.parse(await fs.readFile(queryPath, 'utf8'));
const inventory = JSON.parse(await fs.readFile(inventoryPath, 'utf8'));
if (!Array.isArray(queries) || !Array.isArray(inventory?.sources)) throw new Error('Invalid query or source inventory format');

const records = queries.map((item) => typeof item === 'string' ? { name: item } : item).filter((item) => item?.name);
const sources = inventory.sources.filter((source) => source?.discovery?.mode);

console.log(`Federated fitness media discovery: ${records.length} queries x ${sources.length} machine-queryable sources`);

const work = [];
for (const source of sources) for (const record of records) work.push({ source, record });

const discovered = await mapLimit(work, sourceConcurrency * queryConcurrency, async ({ source, record }) => {
  const candidates = await discoverOne(source, record);
  return { source, record, candidates };
});

const flat = discovered.flatMap((row) => row?.ok ? row.value.candidates : []);
const deduped = new Map();
for (const candidate of flat) {
  const key = `${candidate.exerciseId ?? normalize(candidate.query)}::${candidate.mediaUrl}`;
  const existing = deduped.get(key);
  if (!existing || candidate.score > existing.score) deduped.set(key, candidate);
}

const failures = discovered.filter((row) => !row?.ok);
const output = {
  generatedAt: new Date().toISOString(),
  queryCount: records.length,
  configuredSources: sources.length,
  attemptedSourceQueries: work.length,
  successfulSourceQueries: discovered.filter((row) => row?.ok).length,
  failedSourceQueries: failures.length,
  uniqueCandidates: deduped.size,
  exactMatches: [...deduped.values()].filter((candidate) => candidate.exactMatch).length,
  narrowOpenLicenseCandidates: [...deduped.values()].filter((candidate) => candidate.rightsGate === 'narrow-open-license-candidate' && candidate.exactMatch).length,
  candidates: [...deduped.values()].sort((a, b) => b.score - a.score),
  failures,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outputPath}`);
console.log(`Unique candidates: ${output.uniqueCandidates}; exact matches: ${output.exactMatches}; narrow open-license candidates: ${output.narrowOpenLicenseCandidates}`);
if (failures.length) console.log(`Source-query failures retained: ${failures.length}`);
