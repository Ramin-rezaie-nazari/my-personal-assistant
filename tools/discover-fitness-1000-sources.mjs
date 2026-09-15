#!/usr/bin/env node

/**
 * Free-first fitness media source discovery.
 *
 * This is a discovery layer, not a rights approval layer. It uses the public
 * Common Crawl CDX index to discover real domains/pages related to exercise,
 * workout, fitness, training, yoga, mobility and similar terms. Results are
 * stored as source leads for the federated engine; each asset still requires
 * an explicit license/rights check before MYPA can ingest or redistribute it.
 *
 * Common Crawl asks clients to keep the CDX API request rate low and avoid
 * concurrent requests from the same IP. The default runner therefore uses
 * one request at a time with a delay and retry/backoff. Because some networks
 * reject direct access to Common Crawl from Node/Undici, curl is available as
 * a transport fallback. A small direct-transport smoke test can be run with
 * FITNESS_MEDIA_TRANSPORT_SMOKE=1.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const inventoryPath = path.resolve(process.argv[2] ?? 'data/fitness-media-source-inventory.seed.json');
const outputPath = path.resolve(process.argv[3] ?? 'data/fitness-media-1000-source-discovery.generated.json');
const targetSources = Math.max(1, Number(process.env.FITNESS_MEDIA_TARGET_SOURCES ?? 1000));
const maxPerPattern = Math.max(1, Number(process.env.FITNESS_MEDIA_SOURCE_RESULTS_PER_PATTERN ?? 200));
const delayMs = Math.max(1000, Number(process.env.FITNESS_MEDIA_SOURCE_DISCOVERY_DELAY_MS ?? 1500));
const retryCount = Math.max(0, Number(process.env.FITNESS_MEDIA_SOURCE_DISCOVERY_RETRIES ?? 4));
const curlMaxTimeSeconds = Math.max(10, Number(process.env.FITNESS_MEDIA_CURL_MAX_TIME_SECONDS ?? 90));
const userAgent = process.env.FITNESS_MEDIA_SOURCE_USER_AGENT ?? 'MYPA-fitness-source-discovery/1.0 (https://github.com/Ramin-rezaie-nazari/my-personal-assistant)';
const forceCurl = process.env.FITNESS_MEDIA_USE_CURL === '1';
const smokeTest = process.env.FITNESS_MEDIA_TRANSPORT_SMOKE === '1';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isTransportError(error) {
  return !error?.status;
}

async function curlRequest(url, responseMode) {
  const accept = responseMode === 'json'
    ? 'application/json'
    : 'application/x-ndjson, application/json, text/plain';
  const args = [
    '--fail-with-body', '--silent', '--show-error', '--location',
    '--max-time', String(curlMaxTimeSeconds), '--retry', '2', '--retry-delay', '3',
    '--retry-all-errors', '--user-agent', userAgent, '--header', `Accept: ${accept}`,
    url,
  ];
  const { stdout } = await execFileAsync('curl', args, {
    maxBuffer: 64 * 1024 * 1024,
  });
  return responseMode === 'json' ? JSON.parse(stdout) : stdout;
}

async function requestWithRetry(url, responseMode) {
  let lastError;
  let useCurl = forceCurl;

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      if (useCurl) {
        return await curlRequest(url, responseMode);
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          Accept: responseMode === 'json' ? 'application/json' : 'application/x-ndjson, application/json, text/plain',
        },
      });

      if (response.ok) {
        return responseMode === 'json' ? response.json() : response.text();
      }

      const error = new Error(`HTTP ${response.status} for ${url}`);
      error.status = response.status;
      error.retryAfter = response.headers.get('retry-after');
      lastError = error;
      const retryable = [408, 425, 429, 500, 502, 503, 504].includes(response.status);
      if (!retryable || attempt >= retryCount) throw error;

      const retryAfter = Number(response.headers.get('retry-after') ?? 0);
      const backoff = retryAfter > 0 ? retryAfter * 1000 : Math.min(60000, 3000 * (2 ** attempt));
      console.log(`  ↻ retry ${attempt + 1}/${retryCount} after ${Math.ceil(backoff / 1000)}s (${response.status})`);
      await sleep(backoff);
      continue;
    } catch (error) {
      lastError = error;

      if (!useCurl && isTransportError(error)) {
        console.log('  ↪ fetch transport failed; switching to curl fallback');
        useCurl = true;
      }

      const retryable = !error?.status || [408, 425, 429, 500, 502, 503, 504].includes(error.status);
      if (!retryable || attempt >= retryCount) throw error;

      const backoff = Math.min(60000, 4000 * (2 ** attempt));
      const reason = error?.code ?? (error?.status ? `HTTP ${error.status}` : 'transport error');
      console.log(`  ↻ retry ${attempt + 1}/${retryCount} after ${Math.ceil(backoff / 1000)}s (${reason})`);
      await sleep(backoff);
    }
  }

  throw lastError;
}

async function transportSmokeTest(url) {
  console.log(`Transport smoke test: ${url}`);
  try {
    const result = await curlRequest(url, 'json');
    console.log(`✓ curl transport OK (${Array.isArray(result) ? result.length : 'JSON'} records)`);
    return true;
  } catch (error) {
    console.log(`✗ curl transport failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function registeredDomain(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    const parts = hostname.split('.').filter(Boolean);
    if (parts.length <= 2) return hostname;
    const commonSecondLevel = new Set(['co.uk', 'org.uk', 'ac.uk', 'com.au', 'net.au', 'org.au', 'co.nz', 'co.jp', 'com.br', 'co.in']);
    const suffix2 = parts.slice(-2).join('.');
    return commonSecondLevel.has(suffix2) ? parts.slice(-3).join('.') : suffix2;
  } catch {
    return '';
  }
}

const patterns = [
  'exercise', 'exercise-video', 'exercise-videos', 'workout', 'workout-video', 'workout-videos',
  'fitness', 'fitness-video', 'training', 'training-video', 'gym', 'gym-exercise', 'strength-training',
  'bodyweight', 'calisthenics', 'yoga', 'pilates', 'mobility', 'stretching', 'rehabilitation',
  'physical-therapy', 'personal-training', 'home-workout', 'workout-library', 'exercise-library',
  'movement', 'conditioning', 'hiit', 'cardio', 'weightlifting', 'powerlifting', 'crossfit',
  'resistance-training', 'core-workout', 'kettlebell', 'dumbbell', 'barbell', 'running', 'athletic-training',
];

const blockedHosts = new Set(['facebook.com', 'instagram.com', 'tiktok.com', 'x.com', 'twitter.com', 'youtube.com']);
const inventory = JSON.parse(await fs.readFile(inventoryPath, 'utf8'));
if (!Array.isArray(inventory?.sources)) throw new Error('Invalid inventory JSON: sources must be an array');

const knownDomains = new Set();
for (const source of inventory.sources) {
  if (source?.url) {
    const domain = registeredDomain(source.url);
    if (domain) knownDomains.add(domain);
  }
}

const sourceMap = new Map();
const failures = [];
const startedAt = Date.now();

console.log(`Free 1000-source sweep: target ${targetSources} distinct domains across ${patterns.length} Common Crawl URL patterns`);
console.log(`Known domains already in inventory: ${knownDomains.size}`);

const indexInfo = await requestWithRetry('https://index.commoncrawl.org/collinfo.json', 'json');
const crawlId = Array.isArray(indexInfo) && indexInfo[0]?.id ? String(indexInfo[0].id) : '';
const crawlApi = Array.isArray(indexInfo) && indexInfo[0]?.['cdx-api']
  ? String(indexInfo[0]['cdx-api'])
  : (crawlId ? `https://index.commoncrawl.org/${crawlId}-index` : '');
if (!crawlId || !crawlApi) throw new Error('Common Crawl did not return a current crawl id/API endpoint');

console.log(`Using Common Crawl ${crawlId}`);

if (smokeTest) {
  const ok = await transportSmokeTest('https://index.commoncrawl.org/collinfo.json');
  process.exit(ok ? 0 : 1);
}

let patternIndex = 0;
let consecutiveRateLimitFailures = 0;
for (const pattern of patterns) {
  if (sourceMap.size >= targetSources) break;
  patternIndex += 1;

  const queryUrl = new URL(crawlApi);
  queryUrl.search = new URLSearchParams({
    url: `*/${pattern}*`,
    output: 'json',
    filter: 'status:200',
    fl: 'url',
    limit: String(maxPerPattern),
  }).toString();

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`[pattern ${patternIndex}/${patterns.length}] ${elapsed}s | ${pattern}`);

  try {
    const raw = await requestWithRetry(queryUrl, 'text');
    let addedForPattern = 0;

    for (const line of raw.split('\n').map((value) => value.trim()).filter(Boolean)) {
      let row;
      try { row = JSON.parse(line); } catch { continue; }
      const pageUrl = String(row?.url ?? '');
      const domain = registeredDomain(pageUrl);
      if (!domain || blockedHosts.has(domain) || knownDomains.has(domain) || sourceMap.has(domain)) continue;
      sourceMap.set(domain, {
        id: `cc-discovered-${domain.replace(/[^a-z0-9]+/g, '-')}`,
        url: pageUrl,
        domain,
        type: 'discovered_web_source',
        status: 'discovered-unverified',
        coverage: `Common Crawl URL matched ${pattern}`,
        discovery: {
          mode: 'web_index',
          endpointEnv: 'FITNESS_MEDIA_SEARCH_ENDPOINT',
          commonCrawlPattern: pattern,
          crawlId,
          discoveredAt: new Date().toISOString(),
        },
        rightsAction: 'Treat as discovery lead only; verify exact asset license and MYPA redistribution/hosting rights before approval',
      });
      addedForPattern += 1;
      if (sourceMap.size >= targetSources) break;
    }

    consecutiveRateLimitFailures = 0;
    console.log(`  ✓ ${addedForPattern} new domains from ${pattern}; ${sourceMap.size} total discovered`);
  } catch (error) {
    const failure = {
      pattern,
      error: error instanceof Error ? error.message : String(error),
      code: error?.code ?? null,
      status: error?.status ?? null,
      retryAfter: error?.retryAfter ?? null,
    };
    failures.push(failure);
    const isRateLimited = [429, 502, 503, 504].includes(failure.status);
    consecutiveRateLimitFailures = isRateLimited ? consecutiveRateLimitFailures + 1 : 0;
    console.log(`  ✗ ${failure.error}`);

    if (consecutiveRateLimitFailures >= 3) {
      console.log('  ! Stopping after 3 consecutive rate-limit/server failures; retry later with the same paced runner.');
      break;
    }
  }
  await sleep(delayMs);
}

const discoveredSources = [...sourceMap.values()];
const mergedSources = [...inventory.sources, ...discoveredSources];
const output = {
  generatedAt: new Date().toISOString(),
  targetSources,
  crawlId,
  transport: forceCurl ? 'curl' : 'fetch-with-curl-fallback',
  discoveredSourceCount: discoveredSources.length,
  totalInventorySourceCount: mergedSources.length,
  patterns,
  attemptedPatterns: patternIndex,
  failures,
  sources: discoveredSources,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outputPath}`);
console.log(`Discovered ${discoveredSources.length} new domains; total inventory after merge would be ${mergedSources.length}`);
if (failures.length) console.log(`Patterns with failures: ${failures.length}`);
