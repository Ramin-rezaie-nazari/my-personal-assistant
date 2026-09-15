#!/usr/bin/env node

/**
 * Search-engine based fitness media source discovery fallback.
 *
 * Discovery only: results are source leads, not rights approvals. Each asset
 * still needs an explicit license/permission check before MYPA can ingest or
 * redistribute it.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const inventoryPath = path.resolve(process.argv[2] ?? 'data/fitness-media-source-inventory.seed.json');
const outputPath = path.resolve(process.argv[3] ?? 'data/fitness-media-1000-source-discovery.search.generated.json');
const targetSources = Math.max(1, Number(process.env.FITNESS_MEDIA_TARGET_SOURCES ?? 1000));
const maxResultsPerQuery = Math.max(5, Number(process.env.FITNESS_MEDIA_SEARCH_RESULTS_PER_QUERY ?? 30));
const delayMs = Math.max(1000, Number(process.env.FITNESS_MEDIA_SOURCE_DISCOVERY_DELAY_MS ?? 1500));
const retryCount = Math.max(0, Number(process.env.FITNESS_MEDIA_SOURCE_DISCOVERY_RETRIES ?? 3));
const curlMaxTimeSeconds = Math.max(10, Number(process.env.FITNESS_MEDIA_CURL_MAX_TIME_SECONDS ?? 30));
const userAgent = process.env.FITNESS_MEDIA_SOURCE_USER_AGENT ?? 'MYPA-fitness-source-discovery/1.0 (https://github.com/Ramin-rezaie-nazari/my-personal-assistant)';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function registeredDomain(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    const parts = hostname.split('.').filter(Boolean);
    if (parts.length <= 2) return hostname;
    const commonSecondLevel = new Set([
      'co.uk', 'org.uk', 'ac.uk', 'gov.uk',
      'com.au', 'net.au', 'org.au',
      'co.nz', 'co.jp', 'com.br', 'co.in',
      'com.cn', 'com.sg', 'com.tr', 'com.mx',
    ]);
    const suffix2 = parts.slice(-2).join('.');
    return commonSecondLevel.has(suffix2) ? parts.slice(-3).join('.') : suffix2;
  } catch {
    return '';
  }
}

const blockedHosts = new Set([
  'facebook.com', 'instagram.com', 'tiktok.com', 'x.com', 'twitter.com',
  'youtube.com', 'google.com', 'bing.com', 'duckduckgo.com',
]);

const querySeeds = [
  'exercise video', 'free exercise video', 'open exercise video', 'exercise demonstration video',
  'workout video library', 'exercise video library', 'fitness video library', 'movement video library',
  'strength training video', 'weightlifting exercise video', 'bodyweight exercise video',
  'calisthenics exercise video', 'yoga exercise video', 'pilates exercise video', 'mobility exercise video',
  'stretching exercise video', 'rehabilitation exercise video', 'physical therapy exercise video',
  'home workout video', 'personal training exercise video', 'HIIT exercise video', 'cardio exercise video',
  'kettlebell exercise video', 'dumbbell exercise video', 'barbell exercise video',
  'resistance training exercise video', 'core exercise video', 'athletic training exercise video',
  'exercise tutorial video', 'exercise technique video', 'exercise demonstration library',
  'free fitness videos commercial use', 'open license fitness videos', 'CC BY exercise video',
  'CC0 exercise video', 'public domain exercise video', 'commercial use exercise videos',
  'open source exercise videos', 'exercise videos creative commons',
  'pull up exercise video', 'push up exercise video', 'squat exercise video', 'deadlift exercise video',
  'bench press exercise video', 'shoulder press exercise video', 'row exercise video',
  'lunge exercise video', 'plank exercise video', 'burpee exercise video', 'bicep curl exercise video',
  'tricep extension exercise video', 'leg press exercise video', 'leg raise exercise video',
  'hip thrust exercise video', 'calf raise exercise video', 'chest fly exercise video',
  'lat pulldown exercise video', 'face pull exercise video', 'rear delt exercise video',
  'hamstring curl exercise video', 'leg extension exercise video', 'glute bridge exercise video',
  'romanian deadlift exercise video', 'incline bench press exercise video', 'decline bench press exercise video',
  'front raise exercise video', 'lateral raise exercise video', 'upright row exercise video',
  'hammer curl exercise video', 'preacher curl exercise video', 'skull crusher exercise video',
  'cable crossover exercise video', 'dip exercise video', 'muscle up exercise video',
  'handstand exercise video', 'pistol squat exercise video', 'mountain climber exercise video',
  'jumping jack exercise video', 'high knees exercise video', 'box jump exercise video',
  'kettlebell swing exercise video', 'goblet squat exercise video', 'turkish get up exercise video',
  'clean and press exercise video', 'snatch exercise video', 'farmer carry exercise video',
  'dead bug exercise video', 'bird dog exercise video', 'hollow body exercise video',
  'russian twist exercise video', 'ab rollout exercise video', 'cable crunch exercise video',
  'standing stretch exercise video', 'hip mobility exercise video', 'shoulder mobility exercise video',
  'ankle mobility exercise video', 'thoracic mobility exercise video', 'yoga mobility video',
];

const extraTerms = [
  'site:org', 'site:edu', 'site:gov', 'site:com', 'site:net',
];

const inventory = JSON.parse(await fs.readFile(inventoryPath, 'utf8'));
if (!Array.isArray(inventory?.sources)) throw new Error('Invalid inventory JSON: sources must be an array');

const knownDomains = new Set(inventory.sources.map((source) => registeredDomain(source?.url ?? '')).filter(Boolean));
const sourceMap = new Map();
const failures = [];
const startedAt = Date.now();
const providers = [
  { id: 'duckduckgo', base: 'https://html.duckduckgo.com/html/?q=' },
  { id: 'bing', base: 'https://www.bing.com/search?q=' },
];

async function curl(url) {
  const args = [
    '--fail-with-body', '--silent', '--show-error', '--location',
    '--max-time', String(curlMaxTimeSeconds), '--retry', '1', '--retry-delay', '2',
    '--user-agent', userAgent,
    '--header', 'Accept: text/html,application/xhtml+xml',
    url,
  ];
  const { stdout } = await execFileAsync('curl', args, { maxBuffer: 16 * 1024 * 1024 });
  return stdout;
}

function decodeRedirectUrl(raw) {
  try {
    const value = raw.startsWith('//') ? `https:${raw}` : raw;
    const parsed = new URL(value);
    const uddg = parsed.searchParams.get('uddg');
    return uddg ? decodeURIComponent(uddg) : value;
  } catch {
    return '';
  }
}

function extractLinks(html, provider) {
  const found = [];
  if (provider === 'duckduckgo') {
    for (const match of html.matchAll(/<a[^>]+class=["'][^"']*result__a[^"']*["'][^>]+href=["']([^"']+)["']/gi)) {
      const url = decodeRedirectUrl(match[1]);
      if (url) found.push(url);
    }
  } else {
    for (const match of html.matchAll(/<li[^>]*class=["'][^"']*b_algo[^"']*["'][\s\S]*?<a[^>]+href=["'](https?:\/\/[^"']+)["']/gi)) {
      found.push(match[1]);
    }
  }
  return [...new Set(found)].slice(0, maxResultsPerQuery);
}

async function searchWithFallback(query) {
  let lastError;
  for (const provider of providers) {
    for (let attempt = 0; attempt <= retryCount; attempt += 1) {
      try {
        const url = `${provider.base}${encodeURIComponent(query)}`;
        const html = await curl(url);
        const links = extractLinks(html, provider.id);
        if (links.length) return { provider: provider.id, links };
        lastError = new Error(`${provider.id}: no result links parsed`);
      } catch (error) {
        lastError = error;
      }
      if (attempt < retryCount) await sleep(Math.min(30000, 2000 * (2 ** attempt)));
    }
  }
  throw lastError ?? new Error('No search provider available');
}

const queries = querySeeds.flatMap((seed, index) => {
  const withTerm = index % 3 === 0 ? [seed, `${seed} free`, `${seed} open license`] : [seed];
  return withTerm;
});

console.log(`Search-engine source sweep: target ${targetSources} distinct domains across ${queries.length} queries`);
console.log(`Known domains already in inventory: ${knownDomains.size}`);

for (let i = 0; i < queries.length; i += 1) {
  if (sourceMap.size >= targetSources) break;
  const query = queries[i];
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`[query ${i + 1}/${queries.length}] ${elapsed}s | ${query}`);

  try {
    const result = await searchWithFallback(query);
    let added = 0;
    for (const pageUrl of result.links) {
      const domain = registeredDomain(pageUrl);
      if (!domain || blockedHosts.has(domain) || knownDomains.has(domain) || sourceMap.has(domain)) continue;
      sourceMap.set(domain, {
        id: `search-discovered-${domain.replace(/[^a-z0-9]+/g, '-')}`,
        url: pageUrl,
        domain,
        type: 'discovered_web_source',
        status: 'discovered-unverified',
        coverage: `Search engine result matched query: ${query}`,
        discovery: {
          mode: 'search_engine',
          provider: result.provider,
          query,
          discoveredAt: new Date().toISOString(),
        },
        rightsAction: 'Treat as discovery lead only; verify exact asset license and MYPA redistribution/hosting rights before approval',
      });
      added += 1;
      if (sourceMap.size >= targetSources) break;
    }
    console.log(`  ✓ ${result.provider}: ${result.links.length} links; ${added} new domains; ${sourceMap.size} total discovered`);
  } catch (error) {
    failures.push({ query, error: error instanceof Error ? error.message : String(error), code: error?.code ?? null });
    console.log(`  ✗ ${error instanceof Error ? error.message : String(error)}`);
  }

  await sleep(delayMs);
}

const discoveredSources = [...sourceMap.values()];
const output = {
  generatedAt: new Date().toISOString(),
  discoveryMode: 'search_engine',
  targetSources,
  discoveredSourceCount: discoveredSources.length,
  totalInventorySourceCount: inventory.sources.length + discoveredSources.length,
  queryCount: queries.length,
  failures,
  sources: discoveredSources,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outputPath}`);
console.log(`Discovered ${discoveredSources.length} new domains; total inventory after merge would be ${output.totalInventorySourceCount}`);
console.log(`Failed queries: ${failures.length}`);
