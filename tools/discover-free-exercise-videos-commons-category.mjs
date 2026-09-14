#!/usr/bin/env node

/**
 * Recursively harvest video files from Wikimedia Commons exercise/fitness
 * categories, extracting exact license metadata at asset level.
 *
 * Discovery only. This tool NEVER approves or downloads media.
 *
 * Usage:
 *   node tools/discover-free-exercise-videos-commons-category.mjs categories.json output.json
 *
 * categories.json:
 *   [{"id":"strength","category":"Category:Videos of people demonstrating strength training exercises"}]
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const inputPath = path.resolve(process.argv[2] ?? 'data/fitness-free-commons-categories.sample.json');
const outputPath = path.resolve(process.argv[3] ?? 'data/fitness-free-category-candidates.json');
const maxDepth = Math.max(0, Number(process.env.COMMONS_CATEGORY_MAX_DEPTH ?? 2));
const pageLimit = Math.max(1, Math.min(500, Number(process.env.COMMONS_CATEGORY_PAGE_LIMIT ?? 200)));
const concurrency = Math.max(1, Number(process.env.COMMONS_CATEGORY_CONCURRENCY ?? 3));
const delayMs = Math.max(0, Number(process.env.COMMONS_CATEGORY_DELAY_MS ?? 250));

function stripHtml(value) {
  return String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function classifyLicense(value) {
  const normalized = stripHtml(value).toLowerCase();
  if (normalized.includes('cc0') || normalized.includes('creative commons zero')) return 'cc0';
  if (normalized.includes('cc by-sa') || normalized.includes('cc by sa')) return 'cc-by-sa';
  if (normalized.includes('cc by')) return 'cc-by';
  if (normalized.includes('public domain')) return 'public-domain';
  return 'rights-review-required';
}

function canonicalTitle(title) {
  return String(title ?? '').replace(/^Category:/i, '').replace(/^File:/i, '').trim();
}

async function getJson(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'MYPA-free-exercise-category-discovery/1.0 (research)',
      Accept: 'application/json',
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

async function api(params) {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.search = new URLSearchParams({ action: 'query', format: 'json', ...params }).toString();
  return getJson(url);
}

async function listCategoryMembers(category) {
  const files = [];
  const categories = [];
  let continuation;
  do {
    const data = await api({
      list: 'categorymembers',
      cmtitle: category,
      cmlimit: String(pageLimit),
      cmtype: 'file|subcat',
      ...(continuation ?? {}),
    });
    for (const member of data?.query?.categorymembers ?? []) {
      if (member.ns === 6) files.push(member);
      else if (member.ns === 14) categories.push(member);
    }
    continuation = data?.continue ? {
      cmcontinue: data.continue.cmcontinue,
      continue: data.continue.continue,
    } : null;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  } while (continuation);
  return { files, categories };
}

async function fileMetadata(titles) {
  if (!titles.length) return [];
  const data = await api({
    prop: 'imageinfo',
    titles: titles.join('|'),
    iiprop: 'url|mime|size|sha1|extmetadata',
    iiextmetadatalanguage: 'en',
  });
  return Object.values(data?.query?.pages ?? {}).map((page) => {
    const info = page?.imageinfo?.[0];
    const meta = info?.extmetadata ?? {};
    if (!info) return null;
    const title = canonicalTitle(page.title);
    const mime = String(info.mime ?? '').toLowerCase();
    const isVideo = mime.startsWith('video/') || /\.(webm|mp4|ogv|mov|m4v)$/i.test(title);
    if (!isVideo) return null;
    const license = stripHtml(meta.LicenseShortName?.value ?? '');
    const licenseClass = classifyLicense(license);
    return {
      title,
      sourceProvider: 'wikimedia_commons',
      sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title).replace(/%2F/g, '/')}`,
      mediaUrl: info.url ?? null,
      mimeType: info.mime ?? null,
      bytes: Number(info.size ?? 0) || null,
      sha1: info.sha1 ?? null,
      license,
      licenseClass,
      usageTerms: stripHtml(meta.UsageTerms?.value ?? '') || null,
      creator: stripHtml(meta.Artist?.value ?? '') || null,
      description: stripHtml(meta.ImageDescription?.value ?? '') || null,
      attributionRequired: licenseClass === 'cc-by' || licenseClass === 'cc-by-sa',
      discoveryStatus:
        licenseClass === 'cc0' || licenseClass === 'cc-by' || licenseClass === 'public-domain'
          ? 'open-license-candidate'
          : licenseClass === 'cc-by-sa'
            ? 'sharealike-review'
            : 'rights-review-required',
      approvalRequired: true,
    };
  }).filter(Boolean);
}

async function walk(root, category, depth, seenCategories, files) {
  const canonical = category.trim();
  if (seenCategories.has(canonical) || depth > maxDepth) return;
  seenCategories.add(canonical);
  try {
    const { files: members, categories } = await listCategoryMembers(canonical);
    for (const member of members) files.push({ root, category: canonical, depth, member });
    if (depth < maxDepth) {
      for (const child of categories) {
        await walk(root, child.title, depth + 1, seenCategories, files);
      }
    }
  } catch (error) {
    files.push({ root, category: canonical, depth, error: error instanceof Error ? error.message : String(error) });
  }
}

const roots = JSON.parse(await fs.readFile(inputPath, 'utf8'));
if (!Array.isArray(roots) || !roots.length) throw new Error('categories.json must be a non-empty array');

const allFiles = [];
const seenCategories = new Set();
for (const root of roots) {
  if (!root?.category) continue;
  await walk(root.id ?? root.category, root.category, 0, seenCategories, allFiles);
}

const uniqueFiles = new Map();
for (const entry of allFiles) {
  if (entry?.member?.title) uniqueFiles.set(entry.member.title, entry);
}
const titles = [...uniqueFiles.keys()];

const chunks = [];
for (let index = 0; index < titles.length; index += 50) chunks.push(titles.slice(index, index + 50));
const metadata = [];
let cursor = 0;
async function worker() {
  while (true) {
    const index = cursor++;
    if (index >= chunks.length) return;
    try {
      metadata.push(...await fileMetadata(chunks[index]));
      console.log(`[metadata ${index + 1}/${chunks.length}] ${chunks[index].length} files`);
    } catch (error) {
      console.error(`[metadata ${index + 1}/${chunks.length}] ERROR: ${error instanceof Error ? error.message : String(error)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(1, chunks.length)) }, () => worker()));

const originByTitle = new Map([...uniqueFiles.entries()].map(([title, value]) => [title, value]));
const candidates = metadata.map((item) => {
  const origin = originByTitle.get(`File:${item.title}`) ?? originByTitle.get(item.title);
  return {
    ...item,
    discoveredFrom: origin?.root ?? null,
    discoveredCategory: origin?.category ?? null,
    categoryDepth: origin?.depth ?? null,
  };
});

candidates.sort((a, b) => `${a.discoveredFrom}|${a.title}`.localeCompare(`${b.discoveredFrom}|${b.title}`));
const report = {
  generatedAt: new Date().toISOString(),
  roots: roots.length,
  categoriesVisited: seenCategories.size,
  uniqueVideoFiles: candidates.length,
  openLicenseCandidates: candidates.filter((item) => item.licenseClass === 'cc0' || item.licenseClass === 'cc-by' || item.licenseClass === 'public-domain').length,
  sharealikeReview: candidates.filter((item) => item.licenseClass === 'cc-by-sa').length,
  rightsReviewRequired: candidates.filter((item) => item.licenseClass === 'rights-review-required').length,
  note: 'Discovery only. Verify exact file license/provenance and MYPA distribution/storage rights before approval or download.',
  candidates,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outputPath}`);
console.log(JSON.stringify({ categoriesVisited: report.categoriesVisited, uniqueVideoFiles: report.uniqueVideoFiles, openLicenseCandidates: report.openLicenseCandidates }, null, 2));
