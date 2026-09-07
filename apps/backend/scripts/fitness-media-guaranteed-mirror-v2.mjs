#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(process.env.MYPA_CONTENT_MIRROR_ROOT ?? path.join(process.cwd(), 'content-mirror'));
const MEDIA_ROOT = path.join(ROOT, 'media', 'fitness');
const MANIFEST_PATH = path.join(ROOT, 'fitness-media-guaranteed-manifest.json');
const SUMMARY_PATH = path.join(ROOT, 'fitness-media-guaranteed-summary.json');
const DATASET_URL = process.env.FITNESS_DATASET_URL ?? 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMAGE_ROOT = process.env.FITNESS_IMAGE_ROOT ?? 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const REQUIRED_MEDIA = 4;
const MAX_ITEMS = Number.isFinite(Number(process.env.FITNESS_MEDIA_MAX)) && Number(process.env.FITNESS_MEDIA_MAX) > 0 ? Math.floor(Number(process.env.FITNESS_MEDIA_MAX)) : null;
const CONCURRENCY = Math.min(6, Math.max(1, Number(process.env.FITNESS_MEDIA_CONCURRENCY ?? 4)));
const USER_AGENT = 'MYPA-fitness-guaranteed-media/2.0';
const MAX_BYTES = 64 * 1024;

const clean = (value = '') => String(value).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim();
const normalize = (value = '') => clean(value).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const slug = (value) => normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || createHash('sha1').update(clean(value)).digest('hex').slice(0, 12);
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
async function exists(file) { try { await access(file); return true; } catch { return false; } }
async function saveJson(file, value) { await mkdir(path.dirname(file), { recursive: true }); const tmp = `${file}.tmp-${process.pid}-${Date.now()}`; await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); await rename(tmp, file); }
async function fetchBytes(url) {
  let last;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json,image/avif,image/webp,image/jpeg,image/png,*/*;q=0.8' }, redirect: 'follow' });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) { last = error; if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, 700 * 2 ** attempt)); }
  }
  throw last;
}
async function json(url) { return JSON.parse((await fetchBytes(url)).toString('utf8')); }
function license(meta = {}) {
  const short = clean(meta.LicenseShortName?.value ?? meta.LicenseShortName ?? '');
  const terms = clean(meta.UsageTerms?.value ?? meta.UsageTerms ?? '');
  const text = `${short} ${terms}`;
  if (/non[- ]?commercial|\bNC\b|no derivatives|\bND\b/i.test(text)) return null;
  if (/CC0|public domain|public-domain|PDM|Unlicense/i.test(text)) return /Unlicense/i.test(text) ? 'Unlicense/Public Domain' : 'CC0/Public Domain';
  if (/CC BY-SA/i.test(text)) return 'CC BY-SA';
  if (/CC BY/i.test(text)) return 'CC BY';
  return null;
}
function classify(record) {
  const equipment = normalize(record.equipment ?? '');
  const text = normalize([record.name, record.category, ...(record.primaryMuscles ?? []), ...(record.secondaryMuscles ?? [])].join(' '));
  if (/yoga|asana|pose|warrior|triangle|tree|cobra|pigeon|downward|upward|lotus|camel|sphinx|child|dancer/.test(text)) return 'yoga';
  return !equipment || /none|body only|bodyweight/.test(equipment) ? 'calisthenics' : 'gym';
}
function recordToItem(record) {
  const images = Array.isArray(record.images) ? record.images : [];
  return {
    name: clean(record.name), slug: slug(record.name), discipline: classify(record), sourceId: clean(record.id),
    sourceUrl: `https://github.com/yuhonas/free-exercise-db/blob/main/exercises/${images[0] ?? ''}`,
    license: 'Unlicense/Public Domain', attribution: 'Yuhonas / Free Exercise DB',
    instructions: Array.isArray(record.instructions) ? record.instructions.map(clean).filter(Boolean) : [],
    native: images.map((relative, index) => ({
      position: index + 1, url: `${IMAGE_ROOT}${relative}`, sourceUrl: `https://github.com/yuhonas/free-exercise-db/blob/main/exercises/${relative}`,
      provider: 'Free Exercise DB', license: 'Unlicense/Public Domain', attribution: 'Yuhonas / Free Exercise DB', sourceType: 'licensed-source', evidence: 'Free Exercise DB README declares the dataset public domain/Unlicense.'
    }))
  };
}
async function commonsSearch(name) {
  const queries = [`${name} exercise`, `${name} fitness movement`, `${name} gym`, `${name} yoga`];
  const found = [];
  const seen = new Set();
  for (const query of queries) {
    const p = new URLSearchParams({ action: 'query', generator: 'search', gsrnamespace: '6', gsrsearch: query, gsrlimit: '20', prop: 'imageinfo', iiprop: 'url|mime|size|extmetadata', iiurlwidth: '1200', format: 'json', formatversion: '2' });
    let pages = [];
    try { pages = (await json(`${COMMONS_API}?${p}`))?.query?.pages ?? []; } catch { continue; }
    for (const page of pages) {
      const info = page?.imageinfo?.[0];
      const approved = license(info?.extmetadata ?? {});
      const key = info?.descriptionurl || info?.url;
      if (!info?.url || !approved || seen.has(key)) continue;
      if (!/^image\/(jpeg|png|webp)$/i.test(info.mime ?? '')) continue;
      if (Number(info.width || 0) < 400 || Number(info.height || 0) < 400) continue;
      const haystack = normalize(`${page.title || ''} ${info.extmetadata?.ImageDescription?.value || ''} ${info.extmetadata?.Categories?.value || ''}`);
      const nameToken = normalize(name).split(' ').filter((x) => x.length >= 4);
      const overlap = nameToken.filter((x) => haystack.includes(x)).length;
      if (overlap === 0) continue;
      seen.add(key);
      found.push({ url: info.thumburl || info.url, sourceUrl: key, provider: 'Wikimedia Commons', license: approved, attribution: clean(info.extmetadata?.Artist?.value || info.extmetadata?.Credit?.value || 'Wikimedia contributor'), sourceType: 'licensed-source', evidence: `Wikimedia Commons semantic search: ${query}`, score: overlap });
    }
    if (found.length >= 6) break;
  }
  return found.sort((a, b) => b.score - a.score);
}
function escapeXml(value) { return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'); }
function wrap(text, max = 34) { const words = clean(text).split(/\s+/); const lines = []; let line = ''; for (const word of words) { const next = line ? `${line} ${word}` : word; if (next.length > max && line) { lines.push(line); line = word; } else line = next; } if (line) lines.push(line); return lines.slice(0, 4); }
function svgCard(item, ordinal) {
  const instruction = item.instructions[Math.min(ordinal - 1, Math.max(item.instructions.length - 1, 0))] || `Demonstration reference for ${item.name}.`;
  const titleLines = wrap(item.name, 26); const bodyLines = wrap(instruction, 42);
  const variant = ['Preparation', 'Position', 'Movement', 'Form'][ordinal - 1] ?? 'Reference';
  const yTitle = titleLines.map((line, i) => `<text x="60" y="${84 + i * 42}" font-family="Arial,sans-serif" font-size="34" font-weight="700">${escapeXml(line)}</text>`).join('');
  const yBody = bodyLines.map((line, i) => `<text x="60" y="${590 + i * 28}" font-family="Arial,sans-serif" font-size="20">${escapeXml(line)}</text>`).join('');
  const iconY = 270;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900"><rect width="900" height="900" rx="42" fill="#f7f7f7"/><rect x="36" y="36" width="828" height="72" rx="24" fill="#e8e8e8"/><text x="60" y="82" font-family="Arial,sans-serif" font-size="22" font-weight="700">MYPA · ${escapeXml(item.discipline.toUpperCase())} · ${escapeXml(variant.toUpperCase())}</text>${yTitle}<circle cx="450" cy="${iconY + 70}" r="110" fill="#ffffff" stroke="#222" stroke-width="8"/><circle cx="450" cy="${iconY - 12}" r="28" fill="none" stroke="#222" stroke-width="10"/><path d="M450 ${iconY + 18} L450 ${iconY + 135} M450 ${iconY + 40} L385 ${iconY + 90} M450 ${iconY + 40} L515 ${iconY + 90} M450 ${iconY + 135} L405 ${iconY + 220} M450 ${iconY + 135} L495 ${iconY + 220}" fill="none" stroke="#222" stroke-width="12" stroke-linecap="round"/><text x="60" y="540" font-family="Arial,sans-serif" font-size="24" font-weight="700">Instruction cue</text>${yBody}<text x="60" y="792" font-family="Arial,sans-serif" font-size="18">Generated MYPA instructional fallback · not a photographic evidence image</text><text x="60" y="826" font-family="Arial,sans-serif" font-size="18">Derived directly from the source exercise name/instructions</text></svg>`;
}
async function encodeWebp(input) {
  const attempts = [[900,76],[800,68],[720,60],[640,52],[560,44],[480,36],[420,30],[360,24]];
  let best = null;
  for (const [width, quality] of attempts) {
    const out = await sharp(input, { failOn: 'none' }).rotate().resize({ width, height: width, fit: 'inside', withoutEnlargement: true }).webp({ quality, effort: 5 }).toBuffer();
    best = out;
    if (out.length <= MAX_BYTES) break;
  }
  if (!best || best.length > MAX_BYTES) throw new Error('WebP size budget exceeded');
  return best;
}
async function makeImage(item, candidate, target) {
  const input = candidate.generated ? Buffer.from(svgCard(item, candidate.ordinal)) : await fetchBytes(candidate.url);
  const webp = await encodeWebp(input);
  await writeFile(target, webp);
  return { sizeBytes: webp.length, sha256: sha256(webp), format: 'webp', localPath: path.relative(ROOT, target).split(path.sep).join('/'), objectKey: path.relative(path.join(ROOT, 'media'), target).split(path.sep).join('/') };
}
async function buildItem(item) {
  const dir = path.join(MEDIA_ROOT, item.discipline, item.slug);
  await mkdir(dir, { recursive: true });
  const candidates = [...item.native];
  if (candidates.length < REQUIRED_MEDIA) candidates.push(...(await commonsSearch(item.name)).filter((x) => !candidates.some((c) => c.sourceUrl === x.sourceUrl)));
  const selected = candidates.slice(0, REQUIRED_MEDIA);
  for (let i = selected.length; i < REQUIRED_MEDIA; i += 1) selected.push({ generated: true, ordinal: i + 1, provider: 'MYPA Generated Asset', license: 'MYPA-generated', attribution: 'Generated by MYPA deterministic fitness media fallback', sourceType: 'generated-fallback', evidence: `Derived from exercise name and source instructions: ${item.name}` });
  const media = [];
  const usedHashes = new Set();
  for (let i = 0; i < selected.length; i += 1) {
    const candidate = selected[i];
    let asset;
    try {
      const filename = `${String(i + 1).padStart(2, '0')}-${slug(item.name)}-${i + 1}.webp`;
      const target = path.join(dir, filename);
      asset = await makeImage(item, candidate, target);
      let unique = !usedHashes.has(asset.sha256);
      if (!unique && candidate.generated) { candidate.ordinal = ((candidate.ordinal + 1) % 4) + 1; asset = await makeImage(item, candidate, target); unique = !usedHashes.has(asset.sha256); }
      usedHashes.add(asset.sha256);
      media.push({ position: i + 1, ...asset, provider: candidate.provider, license: candidate.license, attribution: candidate.attribution, sourceUrl: candidate.sourceUrl ?? null, sourceType: candidate.sourceType, evidence: candidate.evidence, status: 'ready' });
    } catch (error) {
      media.push({ position: i + 1, provider: candidate.provider, license: candidate.license, attribution: candidate.attribution, sourceUrl: candidate.sourceUrl ?? null, sourceType: candidate.sourceType, evidence: candidate.evidence, status: 'failed', error: error instanceof Error ? error.message : String(error) });
    }
  }
  const ready = media.filter((x) => x.status === 'ready');
  return { ...item, requiredMedia: REQUIRED_MEDIA, media: ready, mediaCount: ready.length, physicalStatus: ready.length === REQUIRED_MEDIA ? 'complete' : 'incomplete', releaseStatus: ready.length === REQUIRED_MEDIA && ready.every((x) => x.license) ? 'ready' : 'review-required' };
}
function summary(items) {
  const list = Object.values(items); const count = (predicate) => list.filter(predicate).length;
  return {
    schemaVersion: 2, generatedAt: new Date().toISOString(), root: ROOT, requiredMediaPerExercise: REQUIRED_MEDIA, maxBytes: MAX_BYTES,
    exercises: list.length, complete: count((x) => x.physicalStatus === 'complete'), incomplete: count((x) => x.physicalStatus !== 'complete'),
    licensedMedia: list.reduce((n, x) => n + x.media.filter((m) => m.sourceType === 'licensed-source').length, 0), generatedMedia: list.reduce((n, x) => n + x.media.filter((m) => m.sourceType === 'generated-fallback').length, 0),
    disciplines: Object.fromEntries(['gym', 'calisthenics', 'yoga'].map((d) => { const set = list.filter((x) => x.discipline === d); return [d, { exercises: set.length, complete: set.filter((x) => x.physicalStatus === 'complete').length }]; })),
    corpusComplete: list.length > 0 && list.every((x) => x.physicalStatus === 'complete')
  };
}
async function main() {
  await mkdir(MEDIA_ROOT, { recursive: true });
  let manifest = { schemaVersion: 2, generatedAt: null, root: ROOT, items: {} };
  if (await exists(MANIFEST_PATH)) { try { manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8')); } catch {} }
  const dataset = await json(DATASET_URL); if (!Array.isArray(dataset)) throw new Error('Fitness dataset is invalid');
  const rows = (MAX_ITEMS ? dataset.slice(0, MAX_ITEMS) : dataset).map(recordToItem).filter((x) => x.name);
  let cursor = 0; let completed = 0;
  const worker = async () => {
    while (cursor < rows.length) {
      const index = cursor++; const item = rows[index]; const key = `${item.discipline}:${item.slug}`;
      try { manifest.items[key] = await buildItem(item); } catch (error) { manifest.items[key] = { ...item, requiredMedia: REQUIRED_MEDIA, media: [], mediaCount: 0, physicalStatus: 'failed', releaseStatus: 'failed', error: error instanceof Error ? error.message : String(error) }; }
      completed += 1; if (completed % 10 === 0 || completed === rows.length) { await saveJson(MANIFEST_PATH, manifest); console.log(`[fitness-media] ${completed}/${rows.length}`); }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const report = summary(manifest.items); await saveJson(MANIFEST_PATH, manifest); await saveJson(SUMMARY_PATH, report); console.log(JSON.stringify(report, null, 2)); if (!report.corpusComplete) process.exitCode = 2;
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
