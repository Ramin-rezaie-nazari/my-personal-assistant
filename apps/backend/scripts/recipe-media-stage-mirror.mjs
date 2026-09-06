#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { access, mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(process.env.MYPA_CONTENT_MIRROR_ROOT ?? path.join(process.cwd(), 'content-mirror'));
const MEDIA_ROOT = path.join(ROOT, 'media', 'recipes');
const MANIFEST_PATH = path.join(ROOT, 'manifest.json');
const DATASET_URL = process.env.RECIPE_DATASET_URL ?? 'https://huggingface.co/datasets/gossminn/wikibooks-cookbook/resolve/main/recipes_parsed.json?download=true';
const WIKIBOOKS_API = 'https://en.wikibooks.org/w/api.php';
const REQUIRED_PROCESS = 3;
const REQUIRED_TOTAL = 4;
const USER_AGENT = 'MYPA-recipe-stage-mirror/1.2';
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
async function pageData(title) { const page = new URLSearchParams({ action: 'query', titles: `Cookbook:${title}`, prop: 'revisions|images', rvprop: 'content', rvslots: 'main', imlimit: '60', format: 'json', formatversion: '2' }); const data = await json(`${WIKIBOOKS_API}?${page}`); return data?.query?.pages?.[0] ?? {}; }
async function imageInfo(fileTitle) { const query = new URLSearchParams({ action: 'query', titles: fileTitle, prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1600', format: 'json', formatversion: '2' }); const data = await json(`${WIKIBOOKS_API}?${query}`); const info = data?.query?.pages?.[0]?.imageinfo?.[0]; if (!info?.url) return null; const approved = license(info.extmetadata ?? {}); if (!approved || !/^image\/(jpeg|png|webp)$/i.test(info.mime ?? '')) return null; return { url: info.thumburl || info.url, sourceUrl: info.descriptionurl || info.url, license: approved, attribution: clean(info.extmetadata?.Artist?.value || info.extmetadata?.Credit?.value || 'Wikimedia contributor'), width: Number(info.width || 0), height: Number(info.height || 0) }; }
function sectionBlocks(wikitext) { return wikitext.split(/^==+\s*/m).map((part) => { const match = part.match(/^([^=\n]+?)\s*=+\s*\n/); const name = clean(match?.[1] ?? ''); return { name, text: match ? part.slice(match[0].length) : '' }; }).filter((x) => x.name); }
function filesFromText(text) { return [...text.matchAll(/\[\[(?:File|Image):([^|\]#]+)(?:[^\]]*)\]\]/gi)].map((m) => `File:${clean(m[1])}`); }
function unique(values) { return [...new Set(values)]; }
function matchingSections(blocks, pattern) { return blocks.filter((block) => pattern.test(block.name)); }
function chooseProcessFiles(blocks) { return unique(matchingSections(blocks, /^(procedure|directions?|instructions?|method|preparation|steps?)$/i).flatMap((x) => filesFromText(x.text))); }
function chooseFinalFiles(blocks) { return unique(matchingSections(blocks, /^(finished|finish|final|serving|serve|plating|presentation)$/i).flatMap((x) => filesFromText(x.text))); }
function chooseProcess(candidates) { return candidates.filter((x) => x && x.width >= 300 && x.height >= 300).slice(0, REQUIRED_PROCESS); }
function chooseFinal(candidates, process) { const processSet = new Set(process.map((x) => x.sourceUrl)); return candidates.find((x) => !processSet.has(x.sourceUrl)) ?? null; }
async function convert(input, target) { let image = await sharp(input, { failOn: 'none' }).rotate().resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84, effort: 5 }).toBuffer(); if (image.length > 64 * 1024) image = await sharp(input, { failOn: 'none' }).rotate().resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true }).webp({ quality: 72, effort: 5 }).toBuffer(); await writeFile(target, image); return image.length; }
async function cleanRecipeDir(title) { const dir = path.join(MEDIA_ROOT, slug(title)); if (await exists(dir)) await rm(dir, { recursive: true, force: true }); }
async function mirror(title) {
  await cleanRecipeDir(title);
  const page = await pageData(title);
  const revision = page?.revisions?.[0]?.slots?.main?.content ?? '';
  const blocks = sectionBlocks(revision);
  const processFiles = chooseProcessFiles(blocks);
  const finalFiles = chooseFinalFiles(blocks);
  const infos = new Map();
  for (const file of unique([...processFiles, ...finalFiles])) { try { const info = await imageInfo(file); if (info) infos.set(file, { file, ...info }); } catch {} }
  const processCandidates = processFiles.map((file) => infos.get(file)).filter(Boolean);
  const process = chooseProcess(processCandidates);
  const finalCandidates = finalFiles.map((file) => infos.get(file)).filter(Boolean);
  const final = chooseFinal(finalCandidates, process);
  const selected = [
    ...process.map((x, i) => ({ ...x, stage: `process-${i + 1}`, position: i + 1 })),
    ...(final ? [{ ...final, stage: 'final', position: REQUIRED_TOTAL }] : []),
  ];
  const dir = path.join(MEDIA_ROOT, slug(title), 'stages');
  await mkdir(dir, { recursive: true });
  const media = [];
  for (const item of selected) {
    try {
      const input = await fetchBytes(item.url);
      const digest = hash(input);
      const filename = `${String(item.position).padStart(2, '0')}-${item.stage}-${digest.slice(0, 12)}.webp`;
      const target = path.join(dir, filename);
      const sizeBytes = await convert(input, target);
      media.push({ position: item.position, stage: item.stage, localPath: path.relative(ROOT, target).split(path.sep).join('/'), objectKey: path.relative(path.join(ROOT, 'media'), target).split(path.sep).join('/'), sourceUrl: item.sourceUrl, downloadUrl: item.url, sha256: digest, sizeBytes, format: 'webp', provider: 'Wikimedia Commons/Wikibooks', license: item.license, attribution: item.attribution, status: 'ready', evidence: item.stage === 'final' ? 'recipe-page-serving-or-final-image' : 'recipe-page-procedure-image' });
    } catch (error) { media.push({ position: item.position, stage: item.stage, sourceUrl: item.sourceUrl, status: 'failed', error: error instanceof Error ? error.message : String(error) }); }
  }
  const processReady = media.filter((x) => x.status === 'ready' && x.stage.startsWith('process-')).length;
  const finalReady = media.some((x) => x.status === 'ready' && x.stage === 'final');
  const complete = processReady === REQUIRED_PROCESS && finalReady;
  return { media, stageStatus: complete ? 'complete' : 'incomplete', stageRequirement: { processImages: REQUIRED_PROCESS, finalImage: 1 }, sourceEvidence: { procedureImagesFound: processFiles.length, finalSectionImagesFound: finalFiles.length } };
}
async function main() {
  const dataset = await json(DATASET_URL); if (!Array.isArray(dataset)) throw new Error('Recipe dataset is invalid');
  const rows = (MAX_RECIPES ? dataset.slice(0, MAX_RECIPES) : dataset).map((row) => { const data = row?.recipe_data ?? row ?? {}; const lines = Array.isArray(data.text_lines) ? data.text_lines : []; return { title: clean(data.title || row.title || row.filename?.split('/').pop()?.replace(/\.html$/i, '') || ''), ingredients: lines.filter((x) => x?.line_type === 'ul' && /ingredient/i.test(x.section || '')).length, steps: lines.filter((x) => x?.line_type === 'ol' && /procedure|direction|method|instruction|preparation/i.test(x.section || '')).length }; }).filter((x) => x.title && x.ingredients && x.steps);
  let manifest = { schemaVersion: 5, generatedAt: null, root: ROOT, requiredMediaPerItem: REQUIRED_TOTAL, items: {} }; if (await exists(MANIFEST_PATH)) { try { manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8')); } catch {} }
  let cursor = 0; let done = 0; const total = rows.length;
  const worker = async () => { while (cursor < rows.length) { const item = rows[cursor++]; const key = `recipe:${slug(item.title)}`; try { const result = await mirror(item.title); manifest.items[key] = { ...(manifest.items[key] ?? {}), kind: 'recipe', name: item.title, slug: slug(item.title), ...result, media: result.media, mediaCount: result.media.filter((x) => x.status === 'ready').length, legacyImagesRemoved: true }; } catch (error) { manifest.items[key] = { ...(manifest.items[key] ?? {}), kind: 'recipe', name: item.title, slug: slug(item.title), stageStatus: 'failed', media: [], mediaCount: 0, legacyImagesRemoved: true, error: error instanceof Error ? error.message : String(error) }; } done += 1; await saveJson(MANIFEST_PATH, { ...manifest, schemaVersion: 5, generatedAt: new Date().toISOString() }); console.log(`[recipe-stage] ${done}/${total} ${item.title} status=${manifest.items[key].stageStatus} process=${manifest.items[key].media.filter((x) => x.status === 'ready' && x.stage.startsWith('process-')).length}/3 final=${manifest.items[key].media.some((x) => x.status === 'ready' && x.stage === 'final') ? 1 : 0}`); } };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const recipes = Object.values(manifest.items).filter((x) => x.kind === 'recipe'); const complete = recipes.filter((x) => x.stageStatus === 'complete').length; const report = { schemaVersion: 3, generatedAt: new Date().toISOString(), root: ROOT, required: { processImages: REQUIRED_PROCESS, finalImage: 1, total: REQUIRED_TOTAL }, recipes: recipes.length, complete, incomplete: recipes.length - complete }; await saveJson(path.join(ROOT, 'recipe-stage-summary.json'), report); console.log(JSON.stringify(report, null, 2)); if (recipes.length && complete < recipes.length) process.exitCode = 2;
}
main().catch((error) => { console.error(error); process.exit(1); });
