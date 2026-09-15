#!/usr/bin/env node

/**
 * Extract fitness video/media candidates from discovered source pages.
 *
 * This is discovery only. It never approves a license and never downloads
 * media. Exact asset rights must be verified before ingestion/redistribution.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const sourcePath = path.resolve(process.argv[2] ?? 'data/fitness-media-1000-source-discovery.search.generated.json');
const outputPath = path.resolve(process.argv[3] ?? 'data/fitness-media-video-asset-candidates.generated.json');
const maxSources = Math.max(1, Number(process.env.FITNESS_MEDIA_ASSET_MAX_SOURCES ?? 250));
const concurrency = Math.max(1, Number(process.env.FITNESS_MEDIA_ASSET_CONCURRENCY ?? 3));
const timeoutSeconds = Math.max(10, Number(process.env.FITNESS_MEDIA_ASSET_TIMEOUT_SECONDS ?? 25));
const retryCount = Math.max(0, Number(process.env.FITNESS_MEDIA_ASSET_RETRIES ?? 1));
const userAgent = process.env.FITNESS_MEDIA_SOURCE_USER_AGENT ?? 'MYPA-fitness-media-discovery/1.0 (https://github.com/Ramin-rezaie-nazari/my-personal-assistant)';

const exerciseTerms = [
  'squat', 'back squat', 'front squat', 'goblet squat', 'split squat', 'lunge', 'reverse lunge',
  'walking lunge', 'push up', 'pull up', 'chin up', 'lat pulldown', 'bench press', 'shoulder press',
  'lateral raise', 'front raise', 'biceps curl', 'hammer curl', 'triceps extension', 'triceps pushdown',
  'deadlift', 'romanian deadlift', 'sumo deadlift', 'hip thrust', 'glute bridge', 'calf raise',
  'leg raise', 'crunch', 'plank', 'side plank', 'burpee', 'mountain climber', 'jumping jack',
  'kettlebell swing', 'farmer walk', 'row', 'leg press', 'chest fly', 'reverse fly', 'mobility',
  'stretch', 'yoga', 'pilates', 'rehabilitation', 'physical therapy', 'cardio', 'hiit',
];

const licenseHints = [
  ['cc0', /\bcc0\b|creativecommons\.org\/publicdomain/i],
  ['cc-by', /\bcc\s*by\b|creativecommons\.org\/licenses\/by\b/i],
  ['cc-by-sa', /\bcc\s*by[-\s]?sa\b|creativecommons\.org\/licenses\/by-sa\b/i],
  ['public-domain', /public\s+domain|government\s+work/i],
  ['commercial-use', /commercial\s+use|commercially\s+licensed|commercial\s+license/i],
];

function unique(values) { return [...new Set(values.filter(Boolean))]; }

function absoluteUrl(raw, base) {
  try {
    const value = raw.replace(/&amp;/gi, '&').trim();
    if (!value || value.startsWith('data:') || value.startsWith('javascript:')) return '';
    return new URL(value, base).href;
  } catch {
    return '';
  }
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 250_000);
}

function findMeta(html, property) {
  const pattern = new RegExp(`<meta[^>]+(?:property|name)=["']${property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]+content=["']([^"']+)["']`, 'i');
  return html.match(pattern)?.[1] ?? '';
}

function extractCandidates(html, pageUrl) {
  const videoUrls = [];
  const iframeUrls = [];

  for (const match of html.matchAll(/<(?:video|source)[^>]+src=["']([^"']+)["']/gi)) videoUrls.push(absoluteUrl(match[1], pageUrl));
  for (const match of html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:video|og:video:url|twitter:player:stream)["'][^>]+content=["']([^"']+)["']/gi)) videoUrls.push(absoluteUrl(match[1], pageUrl));
  for (const match of html.matchAll(/<(?:iframe|embed)[^>]+(?:src|data-src)=["']([^"']+)["']/gi)) iframeUrls.push(absoluteUrl(match[1], pageUrl));

  const jsonLdUrls = [];
  for (const script of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(script[1]);
      const items = Array.isArray(data) ? data : [data];
      const walk = (value) => {
        if (!value || typeof value !== 'object') return;
        if (typeof value.contentUrl === 'string') jsonLdUrls.push(absoluteUrl(value.contentUrl, pageUrl));
        if (typeof value.embedUrl === 'string') jsonLdUrls.push(absoluteUrl(value.embedUrl, pageUrl));
        for (const child of Object.values(value)) walk(child);
      };
      for (const item of items) walk(item);
    } catch {}
  }

  return {
    videoUrls: unique(videoUrls),
    iframeUrls: unique(iframeUrls),
    jsonLdUrls: unique(jsonLdUrls),
  };
}

function scoreCandidate(url, pageText, source, kind) {
  let score = 0;
  const haystack = `${url} ${pageText}`.toLowerCase();
  const matchedExerciseTerms = exerciseTerms.filter((term) => haystack.includes(term));
  score += Math.min(45, matchedExerciseTerms.length * 5);
  if (/\.webm(?:\?|$)|\.mp4(?:\?|$)|\.mov(?:\?|$)|\.m3u8(?:\?|$)|video/i.test(url)) score += 30;
  if (kind === 'video') score += 20;
  if (kind === 'json-ld') score += 15;
  if (kind === 'iframe') score += 5;
  if (/exercise|workout|fitness|training|yoga|mobility|stretch/i.test(source.coverage ?? '')) score += 10;

  const licenseMatches = [];
  for (const [name, regex] of licenseHints) if (regex.test(pageText)) licenseMatches.push(name);
  if (licenseMatches.includes('cc0') || licenseMatches.includes('cc-by')) score += 25;
  else if (licenseMatches.includes('public-domain') || licenseMatches.includes('commercial-use')) score += 18;
  else if (licenseMatches.includes('cc-by-sa')) score += 8;

  return { score: Math.min(100, score), matchedExerciseTerms, licenseHints: licenseMatches };
}

async function fetchPage(url) {
  const args = [
    '--fail-with-body', '--silent', '--show-error', '--location',
    '--max-time', String(timeoutSeconds), '--retry', String(retryCount), '--retry-delay', '2',
    '--user-agent', userAgent, '--header', 'Accept: text/html,application/xhtml+xml', url,
  ];
  const { stdout } = await execFileAsync('curl', args, { maxBuffer: 24 * 1024 * 1024 });
  return stdout;
}

async function worker(queue, results) {
  while (true) {
    const item = queue.shift();
    if (!item) return;
    try {
      const html = await fetchPage(item.url);
      const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() ?? '';
      const pageText = stripHtml(html);
      const extracted = extractCandidates(html, item.url);
      const local = [];

      for (const url of extracted.videoUrls) {
        const scored = scoreCandidate(url, pageText, item, 'video');
        local.push({ ...scored, exerciseId: item.exerciseId ?? null, exerciseName: item.exerciseName ?? null, pageUrl: item.url, pageTitle: title, mediaUrl: url, kind: 'video', domain: item.domain ?? null, sourceStatus: item.status ?? null, sourceCoverage: item.coverage ?? null });
      }
      for (const url of extracted.jsonLdUrls) {
        const scored = scoreCandidate(url, pageText, item, 'json-ld');
        local.push({ ...scored, exerciseId: item.exerciseId ?? null, exerciseName: item.exerciseName ?? null, pageUrl: item.url, pageTitle: title, mediaUrl: url, kind: 'json-ld', domain: item.domain ?? null, sourceStatus: item.status ?? null, sourceCoverage: item.coverage ?? null });
      }
      for (const url of extracted.iframeUrls) {
        const scored = scoreCandidate(url, pageText, item, 'iframe');
        local.push({ ...scored, exerciseId: item.exerciseId ?? null, exerciseName: item.exerciseName ?? null, pageUrl: item.url, pageTitle: title, mediaUrl: url, kind: 'iframe', domain: item.domain ?? null, sourceStatus: item.status ?? null, sourceCoverage: item.coverage ?? null });
      }

      results.push({ source: item.url, ok: true, candidateCount: local.length, candidates: local });
    } catch (error) {
      results.push({ source: item.url, ok: false, error: error instanceof Error ? error.message : String(error), candidates: [] });
    }
  }
}

const input = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
const sources = Array.isArray(input?.sources) ? input.sources.slice(0, maxSources) : [];
if (!sources.length) throw new Error(`No sources found in ${sourcePath}`);

const queue = [...sources];
const results = [];
const startedAt = Date.now();
console.log(`Asset extraction: ${sources.length} source pages, concurrency ${concurrency}`);
await Promise.all(Array.from({ length: Math.min(concurrency, sources.length) }, () => worker(queue, results)));

const candidates = results.flatMap((result) => result.candidates).sort((a, b) => b.score - a.score);
const output = {
  generatedAt: new Date().toISOString(),
  input: path.basename(sourcePath),
  sourceCount: sources.length,
  successfulSourcePages: results.filter((r) => r.ok).length,
  failedSourcePages: results.filter((r) => !r.ok).length,
  candidateCount: candidates.length,
  highConfidenceCandidateCount: candidates.filter((candidate) => candidate.score >= 60).length,
  rightsReviewRequiredCount: candidates.filter((candidate) => !candidate.licenseHints.length).length,
  durationSeconds: Number(((Date.now() - startedAt) / 1000).toFixed(1)),
  results,
  candidates,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outputPath}`);
console.log(`Successful pages: ${output.successfulSourcePages}/${sources.length}`);
console.log(`Media candidates: ${candidates.length}`);
console.log(`High-confidence: ${output.highConfidenceCandidateCount}`);
console.log(`Candidates without detected license hint: ${output.rightsReviewRequiredCount}`);
