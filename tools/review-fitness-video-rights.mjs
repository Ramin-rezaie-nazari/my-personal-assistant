#!/usr/bin/env node

/**
 * Rights-review preparation for discovered fitness video candidates.
 *
 * This tool does NOT grant rights. It fetches candidate source pages and
 * extracts explicit license/permission evidence, license URLs, attribution
 * hints, and commercial/redistribution language. Every candidate remains
 * unapproved until a human or an exact trusted license rule approves it.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const inputPath = path.resolve(process.argv[2] ?? 'data/fitness-media-video-asset-candidates.generated.json');
const outputPath = path.resolve(process.argv[3] ?? 'data/fitness-media-video-rights-review.generated.json');
const concurrency = Math.max(1, Number(process.env.FITNESS_MEDIA_RIGHTS_CONCURRENCY ?? 3));
const timeoutSeconds = Math.max(10, Number(process.env.FITNESS_MEDIA_RIGHTS_TIMEOUT_SECONDS ?? 25));
const maxCandidates = Math.max(1, Number(process.env.FITNESS_MEDIA_RIGHTS_MAX_CANDIDATES ?? 5000));
const userAgent = process.env.FITNESS_MEDIA_SOURCE_USER_AGENT ?? 'MYPA-fitness-rights-review/1.0 (https://github.com/Ramin-rezaie-nazari/my-personal-assistant)';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const licensePatterns = [
  { id: 'cc0', regex: /(?:creativecommons\.org\/publicdomain|creativecommons\.org\/share-your-work\/public-domain|\bcc0\b)/i, strength: 'strong' },
  { id: 'cc-by', regex: /(?:creativecommons\.org\/licenses\/by(?:\/\d(?:\.\d+)?)?|\bcc\s*by(?:\s*\d(?:\.\d+)?)?\b)/i, strength: 'strong' },
  { id: 'cc-by-sa', regex: /(?:creativecommons\.org\/licenses\/by-sa(?:\/\d(?:\.\d+)?)?|\bcc\s*by[-\s]?sa\b)/i, strength: 'strong' },
  { id: 'cc-by-nd', regex: /(?:creativecommons\.org\/licenses\/by-nd|\bcc\s*by[-\s]?nd\b)/i, strength: 'strong' },
  { id: 'cc-by-nc', regex: /(?:creativecommons\.org\/licenses\/by-nc|\bcc\s*by[-\s]?nc\b)/i, strength: 'strong' },
  { id: 'public-domain', regex: /public\s+domain|public-domain|u\.s\.\s*government\s+work|government\s+work/i, strength: 'medium' },
  { id: 'commercial-use', regex: /commercial\s+use|commercially\s+licensed|commercial\s+license|for\s+commercial\s+use/i, strength: 'medium' },
  { id: 'royalty-free', regex: /royalty[-\s]?free/i, strength: 'weak' },
];

const blockedOrRiskyPlatforms = new Set([
  'youtube.com', 'youtu.be', 'facebook.com', 'instagram.com', 'tiktok.com', 'x.com', 'twitter.com',
];

function registeredDomain(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    const parts = hostname.split('.').filter(Boolean);
    if (parts.length <= 2) return hostname;
    const secondLevel = new Set([
      'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'com.au', 'net.au', 'org.au',
      'co.nz', 'co.jp', 'com.br', 'co.in', 'com.cn', 'com.sg', 'com.tr', 'com.mx',
    ]);
    const suffix2 = parts.slice(-2).join('.');
    return secondLevel.has(suffix2) ? parts.slice(-3).join('.') : suffix2;
  } catch {
    return '';
  }
}

function absoluteUrl(value, base) {
  try {
    const cleaned = value.replace(/&amp;/gi, '&').trim();
    if (!cleaned) return '';
    return new URL(cleaned, base).href;
  } catch {
    return '';
  }
}

function textOnly(html) {
  return html
    .replace(/<script[\\s\\S]*?<\\/script>/gi, ' ')
    .replace(/<style[\\s\\S]*?<\\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\\s+/g, ' ')
    .slice(0, 500_000);
}

function extractEvidence(html, pageUrl) {
  const text = textOnly(html);
  const licenses = [];
  for (const pattern of licensePatterns) {
    if (pattern.regex.test(`${html} ${text}`)) licenses.push({ id: pattern.id, strength: pattern.strength });
  }

  const licenseUrls = new Set();
  for (const match of html.matchAll(/(?:href|src|content)=["']([^"']*(?:creativecommons\\.org|license|licence|rights|terms)[^"']*)["']/gi)) {
    const url = absoluteUrl(match[1], pageUrl);
    if (url) licenseUrls.add(url);
  }

  const attributionHints = [];
  const attributionRegexes = [
    /attribution[^<]{0,240}/ig,
    /credit[^<]{0,240}/ig,
    /author[^<]{0,240}/ig,
    /creator[^<]{0,240}/ig,
    /provided by[^<]{0,240}/ig,
  ];
  for (const regex of attributionRegexes) {
    for (const match of text.matchAll(regex)) attributionHints.push(match[0].trim());
  }

  const rightsLanguage = [];
  for (const pattern of [
    /commercial\s+use[^.]{0,280}/ig,
    /redistribut(?:e|ion)[^.]{0,280}/ig,
    /host(?:ing|ed)[^.]{0,280}/ig,
    /modify|derivative[^.]{0,280}/ig,
    /standalone\s+(?:redistribution|distribution)[^.]{0,280}/ig,
  ]) {
    for (const match of text.matchAll(pattern)) rightsLanguage.push(match[0].trim());
  }

  return {
    licenses,
    licenseUrls: [...licenseUrls].slice(0, 20),
    attributionHints: [...new Set(attributionHints)].slice(0, 10),
    rightsLanguage: [...new Set(rightsLanguage)].slice(0, 20),
  };
}

async function fetchPage(url) {
  const args = [
    '--fail-with-body', '--silent', '--show-error', '--location',
    '--max-time', String(timeoutSeconds), '--retry', '1', '--retry-delay', '2',
    '--user-agent', userAgent, '--header', 'Accept: text/html,application/xhtml+xml', url,
  ];
  const { stdout } = await execFileAsync('curl', args, { maxBuffer: 32 * 1024 * 1024 });
  return stdout;
}

function classify(candidate, evidence) {
  const domain = registeredDomain(candidate.mediaUrl || candidate.pageUrl || '');
  if (blockedOrRiskyPlatforms.has(domain)) {
    return { bucket: 'blocked-platform', approval: 'blocked', reason: 'Platform URL needs separate embedding/hosting rights review' };
  }

  const ids = new Set(evidence.licenses.map((value) => value.id));
  if (ids.has('cc0')) {
    return { bucket: 'open-license-strong', approval: 'eligible-for-manual-approval', reason: 'CC0 evidence detected' };
  }
  if (ids.has('cc-by')) {
    return { bucket: 'open-license-strong', approval: 'eligible-for-manual-approval', reason: 'CC BY evidence detected; attribution required' };
  }
  if (ids.has('public-domain')) {
    return { bucket: 'public-domain-candidate', approval: 'eligible-for-manual-approval', reason: 'Public-domain/government-work evidence detected' };
  }
  if (ids.has('commercial-use')) {
    return { bucket: 'commercial-license-lead', approval: 'manual-rights-review', reason: 'Commercial-use language detected; exact asset and hosting/redistribution scope still required' };
  }
  if (ids.has('cc-by-sa')) {
    return { bucket: 'sharealike-review', approval: 'manual-rights-review', reason: 'CC BY-SA evidence detected; MYPA licensing/derivative obligations need review' };
  }
  return { bucket: 'rights-review-required', approval: 'manual-rights-review', reason: 'No sufficiently explicit open/commercial rights evidence detected' };
}

const input = JSON.parse(await fs.readFile(inputPath, 'utf8'));
const allCandidates = Array.isArray(input?.candidates) ? input.candidates : [];
const candidates = allCandidates.slice(0, maxCandidates);
const queue = [...candidates];
const results = [];

async function worker() {
  while (true) {
    const candidate = queue.shift();
    if (!candidate) return;
    try {
      const html = await fetchPage(candidate.pageUrl);
      const evidence = extractEvidence(html, candidate.pageUrl);
      const classification = classify(candidate, evidence);
      results.push({
        ...candidate,
        rightsEvidence: {
          ...evidence,
          sourcePageFetched: true,
        },
        ...classification,
      });
    } catch (error) {
      results.push({
        ...candidate,
        rightsEvidence: { licenses: [], licenseUrls: [], attributionHints: [], rightsLanguage: [], sourcePageFetched: false },
        bucket: 'rights-review-required',
        approval: 'manual-rights-review',
        reason: `Source page fetch failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, candidates.length) }, () => worker()));
results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

const output = {
  generatedAt: new Date().toISOString(),
  input: path.basename(inputPath),
  inputCandidateCount: allCandidates.length,
  reviewedCandidateCount: results.length,
  summary: {
    openLicenseStrong: results.filter((x) => x.bucket === 'open-license-strong').length,
    publicDomainCandidates: results.filter((x) => x.bucket === 'public-domain-candidate').length,
    commercialLicenseLeads: results.filter((x) => x.bucket === 'commercial-license-lead').length,
    shareAlikeReview: results.filter((x) => x.bucket === 'sharealike-review').length,
    blockedPlatform: results.filter((x) => x.bucket === 'blocked-platform').length,
    rightsReviewRequired: results.filter((x) => x.bucket === 'rights-review-required').length,
    eligibleForManualApproval: results.filter((x) => x.approval === 'eligible-for-manual-approval').length,
  },
  note: 'No record in this output is production-approved. Exact license scope, attribution, commercial use, hosting/redistribution, modifications, and asset-level ownership must be verified before approval.',
  results,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\\n`, 'utf8');
console.log(`Wrote ${outputPath}`);
console.log(`Reviewed candidates: ${results.length}`);
console.log(`Open-license strong: ${output.summary.openLicenseStrong}`);
console.log(`Public-domain candidates: ${output.summary.publicDomainCandidates}`);
console.log(`Commercial-license leads: ${output.summary.commercialLicenseLeads}`);
console.log(`Blocked platforms: ${output.summary.blockedPlatform}`);
console.log(`Manual rights review: ${output.summary.rightsReviewRequired + output.summary.shareAlikeReview}`);
