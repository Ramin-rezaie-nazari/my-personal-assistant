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
const USER_AGENT = 'MYPA-recipe-stage-mirror/1.4';
const CONCURRENCY = Math.min(4, Math.max(1, Number(process.env.RECIPE_STAGE_CONCURRENCY ?? 2)));
const MAX_RECIPES = Number.isFinite(Number(process.env.RECIPE_STAGE_MAX)) && Number(process.env.RECIPE_STAGE_MAX) > 0 ? Math.floor(Number(process.env.RECIPE_STAGE_MAX)) : null;

function clean(value = '') { return String(value).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, ' ').trim(); }
function slug(value) { return clean(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || createHash('sha1').update(clean(value)).digest('hex').slice(0, 12); }
function hash(buffer) { return createHash('sha256').update(buffer).digest('hex'); }
async function exists(file) { try { await access(file); return true; } catch { return false; } }
async function fetchBytes(url) {
  let last;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json,image/avif,image/webp,image/jpeg,image/png,*/*;q=0.8' } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      last = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 700 * 2 ** attempt));
    }
  }
  throw last;
}
async function json(url) { return JSON.parse((await fetchBytes(url)).toString('utf8')); }
async function saveJson(file, value) { await mkdir(path.dirname(file), { recursive: true }); const tmp = `${file}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`; await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); await rename(tmp, file); }
function license(meta = {}) { const short = clean(meta.LicenseShortName?.value ?? meta.LicenseShortName ?? ''); const terms = clean(meta.UsageTerms?.value ?? meta.UsageTerms ?? ''); const text = `${short} ${terms}`; if (/non[- ]?commercial|\bNC\b|no derivatives|\bND\b/i.test(text)) return null; if (/CC0|public domain|public-domain|PDM/i.test(text)) return 'CC0/Public Domain'; if (/CC BY-SA/i.test(text)) return 'CC BY-SA'; if (/CC BY/i.test(text)) return 'CC BY'; return null; }
async function pageData(title) { const params = new URLSearchParams({ action: 'query', titles: `Cookbook:${title}`, prop: 'revisions|images', rvprop: 'content', rvslots: 'main', imlimit: '60', format: 'json', formatversion: '2' }); const data = await json(`${WIKIBOOKS_API}?${params}`); return data?.query?.pages?.[0] ?? {}; }
function revisionText(page) {
  const main = page?.revisions?.[0]?.slots?.main;
  if (typeof main === 'string') return main;
  if (typeof main?.content === 'string') return main.content;
  if (typeof main?.['*'] === 'string') return main['*'];
  if (typeof page?.revisions?.[0]?.content === 'string') return page.revisions[0].content;
  return '';
}
async function imageInfo(fileTitle) { const query = new URLSearchParams({ action: 'query', titles: fileTitle, prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1600', format: 'json', formatversion: '2' }); const data = await json(`${WIKIBOOKS_API}?${query}`); const info = data?.query?.pages?.[0]?.imageinfo?.[0]; if (!info?.url) return null; const approved = license(info.extmetadata ?? {}); if (!approved || !/^image\/(jpeg|png|webp)$/i.test(info.mime ?? '')) return null; return { url: info.thumburl || info.url, sourceUrl: info.descriptionurl || info.url, license: approved, attribution: clean(info.extmetadata?.Artist?.value || info.extmetadata?.Credit?.value || 'Wikimedia contributor'), width: Number(info.width || 0), height: Number(info.height || 0) }; }
function headings(wikitext) {
  return [...wikitext.matchAll(/^(={2,6})\s*(.*?)\s*\1\s*$/gm)].map((m) => ({ level: m[1].length, name: clean(m[2]), index: m.index ?? 0 }));
}
function sectionText(wikitext, heading, nextHeading) { return wikitext.slice(heading.index + heading.name.length + heading.level * 2 + 3, nextHeading?.index ?? wikitext.length); }
function imageRefs(text) {
  return [...text.matchAll(/\[\[(?:File|Image):([^\]|#]+)((?:\|[^\]]*)?)\]\]/gi)].map((m) => {
    const params = String(m[2] || '').split('|').map(clean).filter(Boolean);
    const caption = params.filter((x) => !/^(thumb|thumbnail|frame|frameless|left|right|center|none|upright(?:=.+)?|\d+px)$/i.test(x)).join(' ').trim();
    return { file: `File:${clean(m[1])}`, caption };
  });
}
function uniqueRefs(values) { const seen = new Set(); return values.filter((x) => { if (seen.has(x.file)) return false; seen.add(x.file); return true; }); }
function relevantBlocks(wikitext) {
  const hs = headings(wikitext);
  return hs.map((h, i) => ({ ...h, text: sectionText(wikitext, h, hs[i + 1]) }));
}
function candidateRole(ref) {
  const text = clean(ref.caption).toLowerCase();
  if (/finally|done|finished|ready|served|serving|plated|plating|presentation|serve\b|ready to eat/.test(text)) return 'final';
  if (/ingredient|equipment|implement|oven[, ]*of course/.test(text)) return 'prep';
  if (/^\d+\b|step\s*\d+/.test(text)) return 'process';
  return 'process';
}
function selectProcess(refs, infos) {
  const usable = refs.map((ref) => infos.get(ref.file)).filter(Boolean).filter((x) => x.width >= 300 && x.height >= 300);
  const process = usable.filter((x) => x.role !== 'final' && x.role !== 'prep');
  const pool = process.length >= REQUIRED_PROCESS ? process : usable.filter((x) => x.role !== 'final');
  if (pool.length <= REQUIRED_PROCESS) return pool;
  return [0, 1, 2].map((i) => pool[Math.round(i * (pool.length - 1) / 2)]);
}
function chooseFinal(finalRefs, allRefs, infos, process) {
  const processSet = new Set(process.map((x) => x.sourceUrl));
  const explicit = finalRefs.map((r) => ({ r, i: infos.get(r.file) })).filter((x) => x.i && !processSet.has(x.i.sourceUrl));
  if (explicit.length) return explicit[explicit.length - 1].i;
  const captioned = allRefs.map((r) => ({ r, i: infos.get(r.file) })).filter((x) => x.i && !processSet.has(x.i.sourceUrl) && candidateRole(r) === 'final');
  if (captioned.length) return captioned[captioned.length - 1].i;
  return null;
}
async function convert(input, target) { let image = await sharp(input, { failOn: 'none' }).rotate().resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84, effort: 5 }).toBuffer(); if (image.length > 64 * 1024) image = await sharp(input, { failOn: 'none' }).rotate().resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true }).webp({ quality: 72, effort: 5 }).toBuffer(); await writeFile(target, image); return image.length; }
async function cleanLegacyRecipeDir(title) { const dir = path.join(MEDIA_ROOT, slug(title)); if (!(await exists(dir))) return; for (const entry of await (await import('node:fs/promises')).readdir(dir, { withFileTypes: true })) if (entry.name !== 'stages') await rm(path.join(dir, entry.name), { recursive: true, force: true }); }
async function mirror(title) {
  await cleanLegacyRecipeDir(title);
  const page = await pageData(title);
  const revision = revisionText(page);
  const blocks = relevantBlocks(revision);
  const processBlocks = blocks.filter((b) => /^(procedure|procedure\s*\(detailed\)|method|preparation|directions?|instructions?|steps?)$/i.test(b.name));
  const finalBlocks = blocks.filter((b) => /^(finished|finish|final|serving|serve|plating|presentation)$/i.test(b.name));
  const allRefs = uniqueRefs(blocks.flatMap((b) => imageRefs(b.text)));
  const processRefs = uniqueRefs(processBlocks.flatMap((b) => imageRefs(b.text)));
  const finalRefs = uniqueRefs(finalBlocks.flatMap((b) => imageRefs(b.text)));
  const infos = new Map();
  for (const ref of [...processRefs, ...finalRefs, ...imageRefs(revision)]) { if (!infos.has(ref.file)) { try { const info = await imageInfo(ref.file); if (info) infos.set(ref.file, { ...info, role: candidateRole(ref) }); } catch {} } }
  const process = selectProcess(processRefs, infos);
  const final = chooseFinal(finalRefs, allRefs, infos, process);
  const selected = [...process.map((x, i) => ({ ...x, stage: `process-${i + 1}`, position: i + 1 }))];
  if (final) selected.push({ ...final, stage: 'final', position: REQUIRED_TOTAL });
  const dir = path.join(MEDIA_ROOT, slug(title), 'stages');
  await mkdir(dir, { recursive: true });
  const media = [];
  for (const item of selected) {
    try { const input = await fetchBytes(item.url); const digest = hash(input); const target = path.join(dir, `${String(item.position).padStart(2, '0')}-${item.stage}-${digest.slice(0, 12)}.webp`); const sizeBytes = await convert(input, target); media.push({ position: item.position, stage: item.stage, localPath: path.relative(ROOT, target).split(path.sep).join('/'), objectKey: path.relative(path.join(ROOT, 'media'), target).split(path.sep).join('/'), sourceUrl: item.sourceUrl, downloadUrl: item.url, sha256: digest, sizeBytes, format: 'webp', provider: 'Wikimedia Commons/Wikibooks', license: item.license, attribution: item.attribution, status: 'ready', evidence: item.stage === 'final' ? 'caption-or-final-recipe-section' : 'recipe-procedure-image' }); } catch (error) { media.push({ position: item.position, stage: item.stage, sourceUrl: item.sourceUrl, status: 'failed', error: error instanceof Error ? error.message : String(error) }); }
  }
  const processReady = media.filter((x) => x.status === 'ready' && x.stage.startsWith('process-')).length;
  const finalReady = media.some((x) => x.status === 'ready' && x.stage === 'final');
  return { media, stageStatus: processReady === REQUIRED_PROCESS && finalReady ? 'complete' : 'incomplete', stageRequirement: { processImages: REQUIRED_PROCESS, finalImage: 1 }, sourceEvidence: { procedureImagesFound: processRefs.length, finalSectionImagesFound: finalRefs.length, revisionImagesFound: allRefs.length } };
}
async function main() {
  const dataset = await json(DATASET_URL); if (!Array.isArray(dataset)) throw new Error('Recipe dataset is invalid');
  const rows = (MAX_RECIPES ? dataset.slice(0, MAX_RECIPES) : dataset).map((row) => { const data = row?.recipe_data ?? row ?? {}; const lines = Array.isArray(data.text_lines) ? data.text_lines : []; return { title: clean(data.title || row.title || row.filename?.split('/').pop()?.replace(/\.html$/i, '') || ''), ingredients: lines.filter((x) => x?.line_type === 'ul' && /ingredient/i.test(x.section || '')).length, steps: lines.filter((x) => x?.line_type === 'ol' && /procedure|direction|method|instruction|preparation/i.test(x.section || '')).length }; }).filter((x) => x.title && x.ingredients && x.steps);
  let manifest = { schemaVersion: 6, generatedAt: null, root: ROOT, requiredMediaPerItem: REQUIRED_TOTAL, items: {} }; if (await exists(MANIFEST_PATH)) { try { manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8')); } catch {} }
  let cursor = 0; let done = 0; const total = rows.length;
  const worker = async () => { while (cursor < rows.length) { const item = rows[cursor++]; const key = `recipe:${slug(item.title)}`; try { const result = await mirror(item.title); manifest.items[key] = { ...(manifest.items[key] ?? {}), kind: 'recipe', name: item.title, slug: slug(item.title), ...result, media: result.media, mediaCount: result.media.filter((x) => x.status === 'ready').length, legacyImagesRemoved: true }; } catch (error) { manifest.items[key] = { ...(manifest.items[key] ?? {}), kind: 'recipe', name: item.title, slug: slug(item.title), stageStatus: 'failed', media: [], mediaCount: 0, legacyImagesRemoved: true, error: error instanceof Error ? error.message : String(error) }; } done += 1; await saveJson(MANIFEST_PATH, { ...manifest, schemaVersion: 6, generatedAt: new Date().toISOString() }); console.log(`[recipe-stage] ${done}/${total} ${item.title} status=${manifest.items[key].stageStatus} process=${manifest.items[key].media.filter((x) => x.status === 'ready' && x.stage.startsWith('process-')).length}/3 final=${manifest.items[key].media.some((x) => x.status === 'ready' && x.stage === 'final') ? 1 : 0}`); } };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const recipes = Object.values(manifest.items).filter((x) => x.kind === 'recipe'); const complete = recipes.filter((x) => x.stageStatus === 'complete').length; const report = { schemaVersion: 4, generatedAt: new Date().toISOString(), root: ROOT, required: { processImages: REQUIRED_PROCESS, finalImage: 1, total: REQUIRED_TOTAL }, recipes: recipes.length, complete, incomplete: recipes.length - complete }; await saveJson(path.join(ROOT, 'recipe-stage-summary.json'), report); console.log(JSON.stringify(report, null, 2)); if (recipes.length && complete < recipes.length) process.exitCode = 2;
}
main().catch((error) => { console.error(error); process.exit(1); });
