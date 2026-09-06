#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { access, mkdir, readdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(process.env.MYPA_CONTENT_MIRROR_ROOT ?? path.join(process.cwd(), 'content-mirror'));
const DOMAIN = process.env.CONTENT_MIRROR_DOMAIN ?? 'all';
const REQUIRED = clamp(Number(process.env.CONTENT_MIRROR_REQUIRED_MEDIA ?? 4), 1, 4);
const CONCURRENCY = clamp(Number(process.env.CONTENT_MIRROR_CONCURRENCY ?? 4), 1, 8);
const RETRIES = clamp(Number(process.env.CONTENT_MIRROR_RETRIES ?? 4), 1, 8);
const MAX_RECIPES = positiveLimit(process.env.CONTENT_MIRROR_MAX_RECIPES);
const MAX_FITNESS = positiveLimit(process.env.CONTENT_MIRROR_MAX_FITNESS);
const PROGRESS_EVERY = clamp(Number(process.env.CONTENT_MIRROR_PROGRESS_EVERY ?? 1), 1, 1000);
const USER_AGENT = 'MYPA-content-mirror/1.3';
const RECIPE_DATASET = process.env.RECIPE_DATASET_URL ?? 'https://huggingface.co/datasets/gossminn/wikibooks-cookbook/resolve/main/recipes_parsed.json?download=true';
const WIKIBOOKS_API = 'https://en.wikibooks.org/w/api.php';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const FITNESS_DATASET = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const FITNESS_IMAGE_ROOT = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const MEDIA_ROOT = path.join(ROOT, 'media');
const MANIFEST_PATH = path.join(ROOT, 'manifest.json');
const SUMMARY_PATH = path.join(ROOT, 'summary.json');

function clamp(n, min, max) { return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min; }
function positiveLimit(value) { const n = Number(value); return Number.isFinite(n) && n > 0 ? Math.floor(n) : null; }
function clean(value = '') { return String(value).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, ' ').trim(); }
function slug(value) { return clean(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || createHash('sha1').update(clean(value)).digest('hex').slice(0, 12); }
function hash(buffer) { return createHash('sha256').update(buffer).digest('hex'); }
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function exists(file) { try { await access(file); return true; } catch { return false; } }
async function fileCount(directory) { try { return (await readdir(directory, { withFileTypes: true })).filter((entry) => entry.isFile() && /\.webp$/i.test(entry.name)).length; } catch { return 0; } }
async function fetchBytes(url) {
  let last;
  for (let attempt = 0; attempt < RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json,image/avif,image/webp,image/jpeg,image/png,*/*;q=0.8' } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      last = error;
      if (attempt + 1 < RETRIES) await sleep(700 * 2 ** attempt);
    }
  }
  throw last;
}
async function json(url) { return JSON.parse((await fetchBytes(url)).toString('utf8')); }
async function saveJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(tmp, file);
}

function wikimediaLicense(meta = {}) {
  const short = clean(meta.LicenseShortName?.value ?? meta.LicenseShortName ?? '');
  const terms = clean(meta.UsageTerms?.value ?? meta.UsageTerms ?? '');
  const text = `${short} ${terms}`;
  if (/non[- ]?commercial|\bNC\b|no derivatives|\bND\b/i.test(text)) return null;
  if (/CC0|public domain|public-domain|PDM/i.test(text)) return { license: 'CC0/Public Domain', approval: 'approved' };
  if (/CC BY-SA/i.test(text)) return { license: 'CC BY-SA', approval: 'approved' };
  if (/CC BY/i.test(text)) return { license: 'CC BY', approval: 'approved' };
  return null;
}
async function commons(query, limit = 30) {
  const p = new URLSearchParams({ action: 'query', generator: 'search', gsrsearch: query, gsrnamespace: '6', gsrlimit: String(limit), prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '1600', format: 'json', origin: '*' });
  const data = await json(`${COMMONS_API}?${p}`);
  return Object.values(data?.query?.pages ?? {}).map((page) => page.imageinfo?.[0]).filter(Boolean).map((info) => {
    const policy = wikimediaLicense(info.extmetadata || {});
    return policy ? { url: info.thumburl || info.url, sourceUrl: info.descriptionurl || info.url, provider: 'Wikimedia Commons', attribution: clean(info.extmetadata?.Artist?.value || info.extmetadata?.Credit?.value || 'Wikimedia contributor'), ...policy } : null;
  }).filter((item) => item?.url && !/\.svg$|\.gif$|\.ico$/i.test(item.url));
}
async function recipeCandidates(sourceUrl, title) {
  const raw = sourceUrl?.split('/wiki/')[1] ? decodeURIComponent(sourceUrl.split('/wiki/')[1]).replace(/_/g, ' ') : '';
  const result = [];
  if (raw) {
    const q = new URLSearchParams({ action: 'query', titles: raw, prop: 'images', imlimit: '60', format: 'json', formatversion: '2' });
    const page = await json(`${WIKIBOOKS_API}?${q}`);
    for (const image of page?.query?.pages?.[0]?.images ?? []) {
      const fileTitle = image?.title ?? '';
      if (!/^File:/i.test(fileTitle) || /\.svg$|\.gif$|\.ico$/i.test(fileTitle)) continue;
      const iq = new URLSearchParams({ action: 'query', titles: fileTitle, prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '1600', format: 'json', formatversion: '2' });
      const details = await json(`${WIKIBOOKS_API}?${iq}`);
      const info = details?.query?.pages?.[0]?.imageinfo?.[0];
      const policy = wikimediaLicense(info?.extmetadata || {});
      if (info?.url && policy) result.push({ url: info.thumburl || info.url, sourceUrl: info.descriptionurl || info.url, provider: 'Wikimedia Commons/Wikibooks', attribution: clean(info.extmetadata?.Artist?.value || info.extmetadata?.Credit?.value || 'Wikimedia contributor'), ...policy });
      if (result.length >= REQUIRED) break;
    }
  }
  if (result.length < REQUIRED) {
    const fallback = await commons(`${title} food recipe`, 30);
    const seen = new Set(result.map((x) => x.sourceUrl));
    for (const item of fallback) { if (seen.has(item.sourceUrl)) continue; result.push(item); seen.add(item.sourceUrl); if (result.length >= REQUIRED) break; }
  }
  return result;
}
function parseRecipe(row) {
  const data = row?.recipe_data ?? row ?? {};
  const lines = Array.isArray(data.text_lines) ? data.text_lines : [];
  const title = clean(data.title || row.title || row.filename?.split('/').pop()?.replace(/\.html$/i, '') || '');
  const ingredients = lines.filter((x) => x?.line_type === 'ul' && /ingredient/i.test(x.section || '')).map((x) => clean(x.text)).filter(Boolean);
  const steps = lines.filter((x) => x?.line_type === 'ol' && /procedure|direction|method|instruction|preparation/i.test(x.section || '')).map((x) => clean(x.text)).filter((x) => x.length >= 20);
  return { title, sourceUrl: data.url || (title ? `https://en.wikibooks.org/wiki/Cookbook:${encodeURIComponent(title.replace(/ /g, '_'))}` : null), ingredientCount: ingredients.length, stepCount: steps.length };
}
function parseFitness(record) {
  const equipment = clean(record.equipment || '').toLowerCase();
  const primary = Array.isArray(record.primaryMuscles) ? record.primaryMuscles.join(' ') : clean(record.primaryMuscles || '');
  const text = `${record.name || ''} ${record.category || ''} ${primary}`.toLowerCase();
  const discipline = /yoga|asana|pose|warrior|triangle|tree|cobra|pigeon|downward|upward/.test(text) ? 'yoga' : (!equipment || /none|body only|bodyweight/.test(equipment)) ? 'calisthenics' : 'gym';
  const images = Array.isArray(record.images) ? record.images : [];
  return { kind: 'fitness', name: clean(record.name), slug: slug(record.name), discipline, sourceId: clean(record.id), sourceProvider: 'Free Exercise DB', candidates: images.map((name, i) => ({ url: `${FITNESS_IMAGE_ROOT}${name}`, sourceUrl: `https://github.com/yuhonas/free-exercise-db/blob/main/exercises/${name}`, provider: 'Free Exercise DB', attribution: 'Yuhonas / Free Exercise DB', license: 'Unlicense (dataset)', approval: 'pending-image-license-review', position: i + 1 })) };
}
async function imageToWebp(input, destination) {
  let selected = await sharp(input, { failOn: 'none' }).rotate().resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84, effort: 5 }).toBuffer();
  if (selected.length > 64 * 1024) {
    const compact = await sharp(input, { failOn: 'none' }).rotate().resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true }).webp({ quality: 72, effort: 5 }).toBuffer();
    if (compact.length < selected.length) selected = compact;
  }
  await writeFile(destination, selected);
  return selected.length;
}
async function locallyComplete(previous) {
  if (!previous || previous.physicalStatus !== 'complete' || !Array.isArray(previous.media) || previous.media.length < REQUIRED) return false;
  for (const media of previous.media.slice(0, REQUIRED)) {
    if (media.status !== 'ready' || !media.localPath || !(await exists(path.join(ROOT, media.localPath)))) return false;
  }
  return true;
}
async function diskComplete(directory) { return (await fileCount(directory)) >= REQUIRED; }
function recoveredItem(item, directory) { return { ...item, requiredMedia: REQUIRED, media: [], mediaCount: REQUIRED, physicalStatus: 'complete', releaseStatus: 'license-review-required', recoveredFromDisk: true, recoveryDirectory: path.relative(ROOT, directory).split(path.sep).join('/') }; }
async function checkpoint(manifest, report = null) { await saveJson(MANIFEST_PATH, manifest); if (report) await saveJson(SUMMARY_PATH, report); }
async function mirrorItem(item, directory, candidates) {
  const dir = path.join(MEDIA_ROOT, directory, ...(item.kind === 'fitness' ? [item.discipline] : []), item.slug);
  await mkdir(dir, { recursive: true });
  const media = [];
  const seen = new Set();
  for (const candidate of candidates) {
    if (media.length >= REQUIRED || seen.has(candidate.sourceUrl)) break;
    seen.add(candidate.sourceUrl);
    try {
      const input = await fetchBytes(candidate.url);
      const digest = hash(input);
      const filename = `${String(media.length + 1).padStart(2, '0')}-${digest.slice(0, 12)}.webp`;
      const target = path.join(dir, filename);
      const sizeBytes = await imageToWebp(input, target);
      media.push({ position: media.length + 1, localPath: path.relative(ROOT, target).split(path.sep).join('/'), objectKey: path.relative(MEDIA_ROOT, target).split(path.sep).join('/'), sourceUrl: candidate.sourceUrl, downloadUrl: candidate.url, sha256: digest, sizeBytes, format: 'webp', provider: candidate.provider, license: candidate.license, attribution: candidate.attribution, approval: candidate.approval, status: 'ready' });
    } catch (error) {
      media.push({ position: media.length + 1, sourceUrl: candidate.sourceUrl, downloadUrl: candidate.url, provider: candidate.provider, license: candidate.license, attribution: candidate.attribution, approval: candidate.approval, status: 'failed', error: error instanceof Error ? error.message : String(error) });
    }
  }
  const physical = media.filter((x) => x.status === 'ready').length >= REQUIRED;
  const approval = media.length >= REQUIRED && media.slice(0, REQUIRED).every((x) => x.approval === 'approved');
  return { ...item, requiredMedia: REQUIRED, media, mediaCount: media.filter((x) => x.status === 'ready').length, physicalStatus: physical ? 'complete' : 'incomplete', releaseStatus: physical && approval ? 'ready' : 'license-review-required' };
}
async function runRecipes(manifest) {
  const dataset = await json(RECIPE_DATASET);
  if (!Array.isArray(dataset)) throw new Error('Recipe dataset is invalid');
  const rows = MAX_RECIPES ? dataset.slice(0, MAX_RECIPES) : dataset;
  let cursor = 0;
  let processed = 0;
  let recovered = 0;
  const total = rows.length;
  const worker = async () => {
    while (cursor < rows.length) {
      const row = rows[cursor++];
      const item = parseRecipe(row);
      if (!item.title || !item.ingredientCount || !item.stepCount) continue;
      const key = `recipe:${slug(item.title)}`;
      const dir = path.join(MEDIA_ROOT, 'recipes', slug(item.title));
      if (await locallyComplete(manifest.items[key])) { processed += 1; continue; }
      if (!manifest.items[key] && await diskComplete(dir)) { manifest.items[key] = recoveredItem({ kind: 'recipe', name: item.title, slug: slug(item.title), sourceUrl: item.sourceUrl, ingredientCount: item.ingredientCount, stepCount: item.stepCount }, dir); recovered += 1; processed += 1; await checkpoint(manifest); if (processed % PROGRESS_EVERY === 0) console.log(`[recipes] ${processed}/${total} (recovered ${recovered})`); continue; }
      try {
        manifest.items[key] = await mirrorItem({ kind: 'recipe', name: item.title, slug: slug(item.title), sourceUrl: item.sourceUrl, ingredientCount: item.ingredientCount, stepCount: item.stepCount }, 'recipes', await recipeCandidates(item.sourceUrl, item.title));
      } catch (error) {
        manifest.items[key] = { kind: 'recipe', name: item.title, slug: slug(item.title), sourceUrl: item.sourceUrl, requiredMedia: REQUIRED, media: [], mediaCount: 0, physicalStatus: 'failed', releaseStatus: 'failed', error: error instanceof Error ? error.message : String(error) };
      }
      processed += 1;
      await checkpoint(manifest);
      console.log(`[recipes] ${processed}/${total} complete=${manifest.items[key].physicalStatus === 'complete'} media=${manifest.items[key].mediaCount || 0}`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}
async function runFitness(manifest) {
  const dataset = await json(FITNESS_DATASET);
  if (!Array.isArray(dataset)) throw new Error('Fitness dataset is invalid');
  const rows = (MAX_FITNESS ? dataset.slice(0, MAX_FITNESS) : dataset).map(parseFitness).filter((x) => x.name);
  let cursor = 0;
  let processed = 0;
  let recovered = 0;
  const total = rows.length;
  const worker = async () => {
    while (cursor < rows.length) {
      const item = rows[cursor++];
      const key = `fitness:${item.discipline}:${item.slug}`;
      const dir = path.join(MEDIA_ROOT, 'fitness', item.discipline, item.slug);
      if (await locallyComplete(manifest.items[key])) { processed += 1; continue; }
      if (!manifest.items[key] && await diskComplete(dir)) { manifest.items[key] = recoveredItem(item, dir); recovered += 1; processed += 1; await checkpoint(manifest); if (processed % PROGRESS_EVERY === 0) console.log(`[fitness] ${processed}/${total} (recovered ${recovered})`); continue; }
      try {
        const candidates = [...item.candidates, ...(item.candidates.length < REQUIRED ? await commons(`${item.name} exercise`, 30) : [])].slice(0, REQUIRED);
        manifest.items[key] = await mirrorItem(item, 'fitness', candidates);
      } catch (error) {
        manifest.items[key] = { ...item, requiredMedia: REQUIRED, media: [], mediaCount: 0, physicalStatus: 'failed', releaseStatus: 'failed', error: error instanceof Error ? error.message : String(error) };
      }
      processed += 1;
      await checkpoint(manifest);
      console.log(`[fitness] ${processed}/${total} complete=${manifest.items[key].physicalStatus === 'complete'} media=${manifest.items[key].mediaCount || 0}`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}
function summary(manifest) {
  const items = Object.values(manifest.items);
  const byKind = (kind) => { const set = items.filter((x) => x.kind === kind); return { items: set.length, physicalComplete: set.filter((x) => x.physicalStatus === 'complete').length, physicalIncomplete: set.filter((x) => x.physicalStatus !== 'complete').length, releaseReady: set.filter((x) => x.releaseStatus === 'ready').length, licenseReviewRequired: set.filter((x) => x.releaseStatus === 'license-review-required').length, mediaFiles: set.reduce((n, x) => n + Number(x.mediaCount || 0), 0), requiredMediaFiles: set.length * REQUIRED }; };
  return { schemaVersion: 2, generatedAt: new Date().toISOString(), root: ROOT, requiredMediaPerItem: REQUIRED, recipe: byKind('recipe'), fitness: byKind('fitness'), physicalCorpusComplete: items.length > 0 && items.every((x) => x.physicalStatus === 'complete'), releaseCorpusReady: items.length > 0 && items.every((x) => x.releaseStatus === 'ready') };
}
async function main() {
  await mkdir(MEDIA_ROOT, { recursive: true });
  let manifest = { schemaVersion: 2, generatedAt: null, root: ROOT, requiredMediaPerItem: REQUIRED, items: {} };
  if (await exists(MANIFEST_PATH)) { try { manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8')); } catch {} }
  manifest.schemaVersion = 2; manifest.root = ROOT; manifest.requiredMediaPerItem = REQUIRED; manifest.generatedAt = new Date().toISOString();
  console.log(`[mirror] root=${ROOT} domain=${DOMAIN} requiredMedia=${REQUIRED} concurrency=${CONCURRENCY}`);
  if (DOMAIN === 'all' || DOMAIN === 'recipes') await runRecipes(manifest);
  if (DOMAIN === 'all' || DOMAIN === 'fitness') await runFitness(manifest);
  await checkpoint(manifest, summary(manifest));
  const report = summary(manifest);
  console.log(JSON.stringify(report, null, 2));
  if (!report.physicalCorpusComplete) process.exitCode = 2;
}
main().catch((error) => { console.error(error); process.exit(1); });
