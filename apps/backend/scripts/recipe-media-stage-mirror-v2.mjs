#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(process.env.MYPA_CONTENT_MIRROR_ROOT ?? path.join(process.cwd(), 'content-mirror'));
const MEDIA_ROOT = path.join(ROOT, 'media', 'recipes');
const MANIFEST_PATH = path.join(ROOT, 'manifest.json');
const DATASET_URL = process.env.RECIPE_DATASET_URL ?? 'https://huggingface.co/datasets/gossminn/wikibooks-cookbook/resolve/main/recipes_parsed.json?download=true';
const WIKIBOOKS_API = 'https://en.wikibooks.org/w/api.php';
const REQUIRED_PROCESS = 3;
const REQUIRED_TOTAL = 4;
const CONCURRENCY = Math.min(4, Math.max(1, Number(process.env.RECIPE_STAGE_CONCURRENCY ?? 2)));
const MAX_RECIPES = Number.isFinite(Number(process.env.RECIPE_STAGE_MAX)) && Number(process.env.RECIPE_STAGE_MAX) > 0 ? Math.floor(Number(process.env.RECIPE_STAGE_MAX)) : null;
const USER_AGENT = 'MYPA-recipe-stage-mirror/2.1';

const clean = (value = '') => String(value).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, ' ').trim();
const slug = (value) => clean(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || createHash('sha1').update(clean(value)).digest('hex').slice(0, 12);
const hash = (buffer) => createHash('sha256').update(buffer).digest('hex');
async function exists(file) { try { await access(file); return true; } catch { return false; } }
async function fetchBytes(url) {
  let last;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json,image/*,*/*;q=0.8' } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      last = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 600 * 2 ** attempt));
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
function license(meta = {}) {
  const short = clean(meta.LicenseShortName?.value ?? meta.LicenseShortName ?? '');
  const terms = clean(meta.UsageTerms?.value ?? meta.UsageTerms ?? '');
  const text = `${short} ${terms}`;
  if (/non[- ]?commercial|\bNC\b|no derivatives|\bND\b/i.test(text)) return null;
  if (/CC0|public domain|public-domain|PDM/i.test(text)) return 'CC0/Public Domain';
  if (/CC BY-SA/i.test(text)) return 'CC BY-SA';
  if (/CC BY/i.test(text)) return 'CC BY';
  return null;
}
async function pageWikitext(title) {
  const params = new URLSearchParams({ action: 'parse', page: `Cookbook:${title}`, prop: 'wikitext', format: 'json', formatversion: '2' });
  const data = await json(`${WIKIBOOKS_API}?${params}`);
  return data?.parse?.wikitext ?? '';
}
function refsFromText(text) {
  return [...text.matchAll(/\[\[(?:File|Image):([^\]|#]+)((?:\|[^\]]*)?)\]\]/gi)].map((m) => {
    const params = String(m[2] || '').split('|').map(clean).filter(Boolean);
    const caption = params.filter((x) => !/^(thumb|thumbnail|frame|frameless|left|right|center|none|upright(?:=.+)?|\d+px)$/i.test(x)).join(' ').trim();
    return { file: `File:${clean(m[1])}`, caption };
  });
}
function uniqueRefs(refs) { const seen = new Set(); return refs.filter((ref) => !seen.has(ref.file) && seen.add(ref.file)); }
function findMethodRegion(text) {
  const headings = [...text.matchAll(/^(={2,6})\s*(.*?)\s*\1\s*$/gm)];
  for (let i = headings.length - 1; i >= 0; i -= 1) {
    const name = clean(headings[i][2]);
    if (/^(method|procedure|preparation|directions?|instructions?|steps?)$/i.test(name)) {
      const start = headings[i].index + headings[i][0].length;
      const end = headings[i + 1]?.index ?? text.length;
      return text.slice(start, end);
    }
  }
  return '';
}
function isFinalCaption(caption) { return /(^|\b)(finally|done!?$|finished|ready(?: to (?:eat|serve))?|served|serving|plated|plating|presentation)(\b|$)/i.test(clean(caption)); }
async function imageInfo(fileTitle) {
  const params = new URLSearchParams({ action: 'query', titles: fileTitle, prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1600', format: 'json', formatversion: '2' });
  const info = (await json(`${WIKIBOOKS_API}?${params}`))?.query?.pages?.[0]?.imageinfo?.[0];
  if (!info?.url) return null;
  const approved = license(info.extmetadata ?? {});
  if (!approved || !/^image\/(jpeg|png|webp)$/i.test(info.mime ?? '')) return null;
  return { url: info.thumburl || info.url, sourceUrl: info.descriptionurl || info.url, license: approved, attribution: clean(info.extmetadata?.Artist?.value || info.extmetadata?.Credit?.value || 'Wikimedia contributor'), width: Number(info.width || 0), height: Number(info.height || 0) };
}
async function convert(input, target) {
  let image = await sharp(input, { failOn: 'none' }).rotate().resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84, effort: 5 }).toBuffer();
  if (image.length > 64 * 1024) image = await sharp(input, { failOn: 'none' }).rotate().resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true }).webp({ quality: 72, effort: 5 }).toBuffer();
  await writeFile(target, image);
  return image.length;
}
async function cleanLegacyRecipeDir(title) {
  const dir = path.join(MEDIA_ROOT, slug(title));
  if (!(await exists(dir))) return;
  for (const entry of await (await import('node:fs/promises')).readdir(dir, { withFileTypes: true })) {
    if (entry.name !== 'stages') await rm(path.join(dir, entry.name), { recursive: true, force: true });
  }
}
async function mirror(title) {
  await cleanLegacyRecipeDir(title);
  const revision = await pageWikitext(title);
  const method = findMethodRegion(revision);
  const methodRefs = uniqueRefs(refsFromText(method));
  const allRefs = uniqueRefs(refsFromText(revision));
  const refsToInspect = uniqueRefs([...methodRefs, ...allRefs.slice(0, 16)]);
  const infos = new Map();
  for (const ref of refsToInspect) { try { const info = await imageInfo(ref.file); if (info) infos.set(ref.file, { ...info, caption: ref.caption }); } catch {} }
  const methodInfos = methodRefs.map((ref) => ({ ref, info: infos.get(ref.file) })).filter((x) => x.info && x.info.width >= 300 && x.info.height >= 300);
  const finalCandidate = [...methodInfos].reverse().find(({ ref }) => isFinalCaption(ref.caption));
  const processPool = methodInfos.filter(({ ref }) => !isFinalCaption(ref.caption));
  const process = processPool.slice(0, REQUIRED_PROCESS);
  let final = finalCandidate?.info ?? null;
  let finalEvidence = finalCandidate ? 'recipe-step-final-caption' : null;
  if (!final) {
    const nonMethod = allRefs.filter((ref) => !methodRefs.some((m) => m.file === ref.file)).map((ref) => infos.get(ref.file)).filter(Boolean).filter((info) => info.width >= 300 && info.height >= 300);
    final = nonMethod[0] ?? null;
    if (final) finalEvidence = 'recipe-hero-image';
  }
  const selected = process.map((x, i) => ({ ...x, stage: `process-${i + 1}`, position: i + 1 }));
  if (final && !process.some((x) => x.sourceUrl === final.sourceUrl)) selected.push({ ...final, stage: 'final', position: REQUIRED_TOTAL });
  const dir = path.join(MEDIA_ROOT, slug(title), 'stages');
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const media = [];
  for (const item of selected) {
    try {
      const input = await fetchBytes(item.url);
      const digest = hash(input);
      const target = path.join(dir, `${String(item.position).padStart(2, '0')}-${item.stage}-${digest.slice(0, 12)}.webp`);
      const sizeBytes = await convert(input, target);
      media.push({ position: item.position, stage: item.stage, localPath: path.relative(ROOT, target).split(path.sep).join('/'), objectKey: path.relative(path.join(ROOT, 'media'), target).split(path.sep).join('/'), sourceUrl: item.sourceUrl, downloadUrl: item.url, sha256: digest, sizeBytes, format: 'webp', provider: 'Wikimedia Commons/Wikibooks', license: item.license, attribution: item.attribution, status: 'ready', evidence: item.stage === 'final' ? finalEvidence : 'recipe-method-image' });
    } catch (error) { media.push({ position: item.position, stage: item.stage, sourceUrl: item.sourceUrl, status: 'failed', error: error instanceof Error ? error.message : String(error) }); }
  }
  const processReady = media.filter((x) => x.status === 'ready' && x.stage.startsWith('process-')).length;
  const finalReady = media.some((x) => x.status === 'ready' && x.stage === 'final');
  return { media, mediaCount: media.filter((x) => x.status === 'ready').length, stageStatus: processReady === REQUIRED_PROCESS && finalReady ? 'complete' : 'incomplete', stageRequirement: { processImages: REQUIRED_PROCESS, finalImage: 1 }, sourceEvidence: { methodImagesFound: methodRefs.length, finalCaptionFound: Boolean(finalCandidate), pageImagesFound: allRefs.length } };
}
async function main() {
  const dataset = await json(DATASET_URL); if (!Array.isArray(dataset)) throw new Error('Recipe dataset is invalid');
  const rows = (MAX_RECIPES ? dataset.slice(0, MAX_RECIPES) : dataset).map((row) => { const data = row?.recipe_data ?? row ?? {}; const lines = Array.isArray(data.text_lines) ? data.text_lines : []; return { title: clean(data.title || row.title || row.filename?.split('/').pop()?.replace(/\.html$/i, '') || ''), ingredients: lines.filter((x) => x?.line_type === 'ul' && /ingredient/i.test(x.section || '')).length, steps: lines.filter((x) => x?.line_type === 'ol' && /procedure|direction|method|instruction|preparation/i.test(x.section || '')).length }; }).filter((x) => x.title && x.ingredients && x.steps);
  let manifest = { schemaVersion: 8, generatedAt: null, root: ROOT, requiredMediaPerItem: REQUIRED_TOTAL, items: {} }; if (await exists(MANIFEST_PATH)) { try { manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8')); } catch {} }
  let cursor = 0; let done = 0; const total = rows.length;
  const worker = async () => { while (cursor < rows.length) { const item = rows[cursor++]; const key = `recipe:${slug(item.title)}`; try { const result = await mirror(item.title); manifest.items[key] = { kind: 'recipe', name: item.title, slug: slug(item.title), ...result, legacyImagesRemoved: true }; } catch (error) { manifest.items[key] = { kind: 'recipe', name: item.title, slug: slug(item.title), stageStatus: 'failed', media: [], mediaCount: 0, legacyImagesRemoved: true, error: error instanceof Error ? error.message : String(error) }; } done += 1; await saveJson(MANIFEST_PATH, { ...manifest, schemaVersion: 8, generatedAt: new Date().toISOString() }); const entry = manifest.items[key]; console.log(`[recipe-stage] ${done}/${total} ${item.title} status=${entry.stageStatus} process=${entry.media.filter((x) => x.status === 'ready' && x.stage.startsWith('process-')).length}/3 final=${entry.media.some((x) => x.status === 'ready' && x.stage === 'final') ? 1 : 0} evidence=${entry.sourceEvidence?.finalCaptionFound ? 'caption-final' : entry.media.some((x) => x.evidence === 'recipe-hero-image') ? 'recipe-hero-image' : entry.sourceEvidence?.methodImagesFound ? `method-${entry.sourceEvidence.methodImagesFound}` : 'none'}`); } };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const recipes = Object.values(manifest.items).filter((x) => x.kind === 'recipe'); const complete = recipes.filter((x) => x.stageStatus === 'complete').length; const incomplete = recipes.length - complete; const report = { schemaVersion: 7, generatedAt: new Date().toISOString(), root: ROOT, required: { processImages: REQUIRED_PROCESS, finalImage: 1, total: REQUIRED_TOTAL }, recipes: recipes.length, complete, incomplete }; await saveJson(path.join(ROOT, 'recipe-stage-summary.json'), report); console.log(JSON.stringify(report, null, 2)); if (recipes.length && incomplete) process.exitCode = 2;
}
main().catch((error) => { console.error(error); process.exit(1); });
