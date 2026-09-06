#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, rm, access } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(process.env.MYPA_CONTENT_MIRROR_ROOT ?? path.join(process.cwd(), 'content-mirror'));
const DOMAIN = process.env.CONTENT_MIRROR_DOMAIN ?? 'all';
const REQUIRED = clampInt(process.env.CONTENT_MIRROR_REQUIRED_MEDIA ?? 4, 1, 4);
const MAX_RECIPES = envLimit('CONTENT_MIRROR_MAX_RECIPES');
const MAX_FITNESS = envLimit('CONTENT_MIRROR_MAX_FITNESS');
const CONCURRENCY = clampInt(process.env.CONTENT_MIRROR_CONCURRENCY ?? 4, 1, 8);
const RETRIES = clampInt(process.env.CONTENT_MIRROR_RETRIES ?? 4, 1, 8);
const USER_AGENT = 'MYPA-content-mirror/1.0';
const RECIPE_DATASET = process.env.RECIPE_DATASET_URL ?? 'https://huggingface.co/datasets/gossminn/wikibooks-cookbook/resolve/main/recipes_parsed.json?download=true';
const WIKIBOOKS_API = 'https://en.wikibooks.org/w/api.php';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const FITNESS_DATASET = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const FITNESS_IMAGE_ROOT = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises/';
const MEDIA_ROOT = path.join(ROOT, 'media');
const MANIFEST_PATH = path.join(ROOT, 'manifest.json');
const SUMMARY_PATH = path.join(ROOT, 'summary.json');

function clampInt(value, min, max) {
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
}
function envLimit(name) {
  if (!process.env[name]) return null;
  const n = Number.parseInt(process.env[name], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function clean(value = '') {
  return String(value).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, ' ').trim();
}
function slug(value) {
  return clean(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || createHash('sha1').update(clean(value)).digest('hex').slice(0, 12);
}
function sha256(buffer) { return createHash('sha256').update(buffer).digest('hex'); }
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
async function fetchBuffer(url, attempts = RETRIES) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'image/avif,image/webp,image/jpeg,image/png,*/*;q=0.8' } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      last = error;
      if (i < attempts - 1) await sleep(750 * 2 ** i);
    }
  }
  throw last;
}
async function fetchJson(url) {
  const buffer = await fetchBuffer(url);
  return JSON.parse(buffer.toString('utf8'));
}
async function exists(file) { try { await access(file); return true; } catch { return false; } }
async function atomicWrite(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(tmp, file);
}
function licenseFromMeta(meta = {}) {
  const short = clean(meta.LicenseShortName?.value ?? meta.LicenseShortName ?? '');
  const terms = clean(meta.UsageTerms?.value ?? meta.UsageTerms ?? '');
  const combined = `${short} ${terms}`;
  if (/non[- ]?commercial|\bNC\b|no derivatives|\bND\b/i.test(combined)) return null;
  if (/CC0|public domain|public-domain|PDM/i.test(combined)) return 'CC0/Public Domain';
  if (/CC BY-SA/i.test(combined)) return 'CC BY-SA';
  if (/CC BY/i.test(combined)) return 'CC BY';
  return null;
}
async function searchCommons(query, limit = 24) {
  const params = new URLSearchParams({ action: 'query', generator: 'search', gsrsearch: query, gsrnamespace: '6', gsrlimit: String(limit), prop: 'imageinfo', iiprop: 'url|extmetadata|mime|size', iiurlwidth: '1200', format: 'json', origin: '*' });
  const data = await fetchJson(`${COMMONS_API}?${params}`);
  return Object.values(data?.query?.pages ?? {}).map((page) => page.imageinfo?.[0]).filter(Boolean).map((info) => {
    const license = licenseFromMeta(info.extmetadata || {});
    const url = info.thumburl || info.url;
    return { url, sourceUrl: info.descriptionurl || info.url, license, provider: 'Wikimedia Commons', attribution: clean(info.extmetadata?.Artist?.value || info.extmetadata?.Credit?.value || 'Wikimedia contributor') };
  }).filter((item) => item.url && item.license && !/\.svg$|\.gif$|\.ico$/i.test(item.url));
}
async function recipeMedia(sourceUrl, title) {
  const rawTitle = decodeURIComponent(sourceUrl?.split('/wiki/')[1] || '').replace(/_/g, ' ');
  const candidates = [];
  if (rawTitle) {
    const params = new URLSearchParams({ action: 'query', titles: rawTitle, prop: 'images', imlimit: '60', format: 'json', formatversion: '2' });
    const data = await fetchJson(`${WIKIBOOKS_API}?${params}`);
    for (const image of data?.query?.pages?.[0]?.images ?? []) {
      if (!/^File:/i.test(image?.title ?? '') || /\.svg$|\.gif$|\.ico$/i.test(image.title)) continue;
      const details = new URLSearchParams({ action: 'query', titles: image.title, prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '1600', format: 'json', formatversion: '2' });
      const detail = await fetchJson(`${WIKIBOOKS_API}?${details}`);
      const info = detail?.query?.pages?.[0]?.imageinfo?.[0];
      const license = licenseFromMeta(info?.extmetadata || {});
      if (info?.url && license) candidates.push({ url: info.thumburl || info.url, sourceUrl: info.descriptionurl || info.url, license, provider: 'Wikimedia Commons/Wikibooks', attribution: clean(info.extmetadata?.Artist?.value || info.extmetadata?.Credit?.value || 'Wikimedia contributor') });
      if (candidates.length >= REQUIRED) break;
      await sleep(75);
    }
  }
  if (candidates.length < REQUIRED) {
    const fallback = await searchCommons(`${title} food recipe`, 30);
    const seen = new Set(candidates.map((x) => x.sourceUrl));
    for (const item of fallback) { if (seen.has(item.sourceUrl)) continue; candidates.push(item); seen.add(item.sourceUrl); if (candidates.length >= REQUIRED) break; }
  }
  return candidates;
}
function parseRecipe(row) {
  const data = row?.recipe_data ?? row ?? {};
  const lines = Array.isArray(data.text_lines) ? data.text_lines : [];
  const title = clean(data.title || row.title || row.filename?.split('/').pop()?.replace(/\.html$/i, '') || 'Untitled Recipe');
  const ingredients = lines.filter((line) => line?.line_type === 'ul' && /ingredient/i.test(line.section || '')).map((line) => clean(line.text)).filter(Boolean);
  const steps = lines.filter((line) => line?.line_type === 'ol' && /procedure|direction|method|instruction|preparation/i.test(line.section || '')).map((line) => clean(line.text)).filter((text) => text.length >= 20);
  return { title, sourceUrl: data.url || `https://en.wikibooks.org/wiki/Cookbook:${encodeURIComponent(title.replace(/ /g, '_'))}`, ingredients: ingredients.length, steps: steps.length };
}
function parseFitness(record) {
  const equipment = clean(record.equipment || '').toLowerCase();
  const images = Array.isArray(record.images) ? record.images : [];
  const bodyweight = !equipment || /none|body only|bodyweight/.test(equipment);
  const textValue = `${record.name || ''} ${record.category || ''} ${record.primaryMuscles || ''}`.toLowerCase();
  const discipline = /yoga|asana|pose|warrior|triangle|tree|cobra|pigeon|downward|upward/.test(textValue) ? 'yoga' : bodyweight ? 'calisthenics' : 'gym';
  return { name: clean(record.name), slug: slug(record.name), discipline, sourceId: clean(record.id), sourceProvider: 'Free Exercise DB', license: 'Public Domain / Unlicense', images: images.map((item, index) => ({ url: `${FITNESS_IMAGE_ROOT}${item}`, sourceUrl: `https://github.com/yuhonas/free-exercise-db/blob/main/dist/exercises/${item}`, license: 'Public Domain / Unlicense', provider: 'Free Exercise DB', attribution: 'Yuhonas / Free Exercise DB', position: index + 1 })) };
}
async function convertToWebp(input, destination) {
  const output = await sharp(input, { failOn: 'none' }).rotate().resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84, effort: 5 }).toBuffer();
  if (output.length > 64 * 1024) {
    const smaller = await sharp(input, { failOn: 'none' }).rotate().resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true }).webp({ quality: 72, effort: 5 }).toBuffer();
    await writeFile(destination, smaller.length < output.length ? smaller : output);
    return Math.min(smaller.length, output.length);
  }
  await writeFile(destination, output);
  return output.length;
}
async function mirrorItem(item, kind, mediaCandidates) {
  const itemRoot = path.join(MEDIA_ROOT, kind, ...(kind === 'fitness' ? [item.discipline] : []), item.slug);
  await mkdir(itemRoot, { recursive: true });
  const media = [];
  const seen = new Set();
  for (const candidate of mediaCandidates) {
    if (media.length >= REQUIRED || seen.has(candidate.sourceUrl)) break;
    seen.add(candidate.sourceUrl);
    try {
      const bytes = await fetchBuffer(candidate.url);
      const hash = sha256(bytes);
      const file = path.join(itemRoot, `${String(media.length + 1).padStart(2, '0')}-${hash.slice(0, 12)}.webp`);
      const bytesWritten = await convertToWebp(bytes, file);
      media.push({ position: media.length + 1, localPath: path.relative(ROOT, file).split(path.sep).join('/'), sourceUrl: candidate.sourceUrl, downloadUrl: candidate.url, sha256: hash, sizeBytes: bytesWritten, format: 'webp', license: candidate.license, provider: candidate.provider, attribution: candidate.attribution, status: 'ready' });
    } catch (error) {
      media.push({ position: media.length + 1, sourceUrl: candidate.sourceUrl, downloadUrl: candidate.url, license: candidate.license, provider: candidate.provider, attribution: candidate.attribution, status: 'failed', error: error instanceof Error ? error.message : String(error) });
    }
  }
  return { ...item, requiredMedia: REQUIRED, media, mediaCount: media.filter((m) => m.status === 'ready').length, completeness: media.filter((m) => m.status === 'ready').length >= REQUIRED ? 'complete' : 'incomplete' };
}
async function runRecipes(manifest) {
  const dataset = await fetchJson(RECIPE_DATASET);
  if (!Array.isArray(dataset)) throw new Error('Recipe dataset is not an array');
  const rows = MAX_RECIPES ? dataset.slice(0, MAX_RECIPES) : dataset;
  let cursor = 0;
  const worker = async () => {
    while (cursor < rows.length) {
      const row = rows[cursor++];
      const parsed = parseRecipe(row);
      if (!parsed.title || parsed.title === 'Untitled Recipe' || parsed.ingredients === 0 || parsed.steps === 0) continue;
      const key = `recipe:${slug(parsed.title)}`;
      const previous = manifest.items[key];
      if (previous?.completeness === 'complete' && previous.media?.every((m) => m.status === 'ready' && m.localPath && await exists(path.join(ROOT, m.localPath)))) continue;
      try {
        const candidates = await recipeMedia(parsed.sourceUrl, parsed.title);
        manifest.items[key] = await mirrorItem({ kind: 'recipe', name: parsed.title, slug: slug(parsed.title), sourceUrl: parsed.sourceUrl, ingredientCount: parsed.ingredients, stepCount: parsed.steps }, 'recipes', candidates);
      } catch (error) {
        manifest.items[key] = { kind: 'recipe', name: parsed.title, slug: slug(parsed.title), sourceUrl: parsed.sourceUrl, requiredMedia: REQUIRED, media: [], mediaCount: 0, completeness: 'failed', error: error instanceof Error ? error.message : String(error) };
      }
      if (Object.keys(manifest.items).length % 25 === 0) await atomicWrite(MANIFEST_PATH, manifest);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}
async function runFitness(manifest) {
  const dataset = await fetchJson(FITNESS_DATASET);
  if (!Array.isArray(dataset)) throw new Error('Fitness dataset is not an array');
  const rows = (MAX_FITNESS ? dataset.slice(0, MAX_FITNESS) : dataset).map(parseFitness).filter((x) => x.name);
  let cursor = 0;
  const worker = async () => {
    while (cursor < rows.length) {
      const item = rows[cursor++];
      const key = `fitness:${item.discipline}:${item.slug}`;
      const previous = manifest.items[key];
      if (previous?.completeness === 'complete' && previous.media?.every((m) => m.status === 'ready' && m.localPath && await exists(path.join(ROOT, m.localPath)))) continue;
      try {
        let candidates = [...item.images];
        if (candidates.length < REQUIRED) {
          const commons = await searchCommons(`${item.name} exercise`, 30);
          const seen = new Set(candidates.map((m) => m.sourceUrl));
          for (const media of commons) { if (seen.has(media.sourceUrl)) continue; candidates.push({ ...media, position: candidates.length + 1 }); seen.add(media.sourceUrl); if (candidates.length >= REQUIRED) break; }
        }
        manifest.items[key] = await mirrorItem({ kind: 'fitness', name: item.name, slug: item.slug, discipline: item.discipline, sourceId: item.sourceId, sourceProvider: item.sourceProvider, license: item.license }, 'fitness', candidates);
      } catch (error) {
        manifest.items[key] = { kind: 'fitness', name: item.name, slug: item.slug, discipline: item.discipline, requiredMedia: REQUIRED, media: [], mediaCount: 0, completeness: 'failed', error: error instanceof Error ? error.message : String(error) };
      }
      if (Object.keys(manifest.items).length % 25 === 0) await atomicWrite(MANIFEST_PATH, manifest);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}
function summarize(manifest) {
  const all = Object.values(manifest.items);
  const byKind = (kind) => {
    const items = all.filter((x) => x.kind === kind);
    return { items: items.length, complete: items.filter((x) => x.completeness === 'complete').length, incomplete: items.filter((x) => x.completeness === 'incomplete').length, failed: items.filter((x) => x.completeness === 'failed').length, readyMedia: items.reduce((sum, x) => sum + Number(x.mediaCount || 0), 0), requiredMedia: items.length * REQUIRED };
  };
  return { generatedAt: new Date().toISOString(), root: ROOT, requiredMediaPerItem: REQUIRED, recipe: byKind('recipe'), fitness: byKind('fitness'), overallComplete: all.length > 0 && all.every((x) => x.completeness === 'complete'), incompleteKeys: all.filter((x) => x.completeness !== 'complete').map((x) => `${x.kind}:${x.name}`).slice(0, 200) };
}
async function main() {
  await mkdir(MEDIA_ROOT, { recursive: true });
  let manifest = { schemaVersion: 1, generatedAt: null, root: ROOT, requiredMediaPerItem: REQUIRED, items: {} };
  if (await exists(MANIFEST_PATH)) {
    try { manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8')); } catch { await rm(MANIFEST_PATH, { force: true }); }
  }
  manifest.root = ROOT; manifest.requiredMediaPerItem = REQUIRED; manifest.generatedAt = new Date().toISOString();
  if (DOMAIN === 'all' || DOMAIN === 'recipes') await runRecipes(manifest);
  if (DOMAIN === 'all' || DOMAIN === 'fitness') await runFitness(manifest);
  await atomicWrite(MANIFEST_PATH, manifest);
  const summary = summarize(manifest);
  await atomicWrite(SUMMARY_PATH, summary);
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.overallComplete) process.exitCode = 2;
}
main().catch((error) => { console.error(error); process.exit(1); });
