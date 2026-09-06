#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, rename, rm, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(process.env.MYPA_CONTENT_MIRROR_ROOT ?? path.join(process.cwd(), 'content-mirror'));
const MEDIA_ROOT = path.join(ROOT, 'media', 'recipes');
const MANIFEST_PATH = path.join(ROOT, 'manifest.json');
const DATASET_URL = process.env.RECIPE_DATASET_URL ?? 'https://huggingface.co/datasets/gossminn/wikibooks-cookbook/resolve/main/recipes_parsed.json?download=true';
const WIKIBOOKS_API = 'https://en.wikibooks.org/w/api.php';
const REQUIRED_PROCESS = 3;
const REQUIRED_TOTAL = 4;
const MAX_RECIPES = Number.isFinite(Number(process.env.RECIPE_STAGE_MAX)) && Number(process.env.RECIPE_STAGE_MAX) > 0 ? Math.floor(Number(process.env.RECIPE_STAGE_MAX)) : null;
const CONCURRENCY = Math.min(4, Math.max(1, Number(process.env.RECIPE_STAGE_CONCURRENCY ?? 2)));
const USER_AGENT = 'MYPA-recipe-stage-mirror/4.0';
const SECTION_RE = /^(method|directions?|procedure|preparation|instructions?|steps?|how to make|cooking method)$/i;

const clean = (value = '') => String(value)
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/\\s+/g, ' ')
  .trim();
const titleClean = (value = '') => clean(value).replace(/^(?:['\"]+)|(?:['\"]+)$/g, '').trim();
const slug = (value) => titleClean(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9\\s-]/g, '').replace(/\\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || createHash('sha1').update(titleClean(value)).digest('hex').slice(0, 12);
const hash = (buffer) => createHash('sha256').update(buffer).digest('hex');
async function exists(file) { try { await access(file); return true; } catch { return false; } }
async function fetchBytes(url) {
  let last;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json,text/html,image/*,*/*;q=0.8' } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      last = error;
      if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, 700 * 2 ** attempt));
    }
  }
  throw last;
}
async function json(url) { return JSON.parse((await fetchBytes(url)).toString('utf8')); }
async function saveJson(file, value) { await mkdir(path.dirname(file), { recursive: true }); const tmp = `${file}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`; await writeFile(tmp, `${JSON.stringify(value, null, 2)}\\n`, 'utf8'); await rename(tmp, file); }
function license(meta = {}) {
  const short = clean(meta.LicenseShortName?.value ?? meta.LicenseShortName ?? '');
  const terms = clean(meta.UsageTerms?.value ?? meta.UsageTerms ?? '');
  const text = `${short} ${terms}`;
  if (/non[- ]?commercial|\\bNC\\b|no derivatives|\\bND\\b/i.test(text)) return null;
  if (/CC0|public domain|public-domain|PDM/i.test(text)) return 'CC0/Public Domain';
  if (/CC BY-SA/i.test(text)) return 'CC BY-SA';
  if (/CC BY/i.test(text)) return 'CC BY';
  return null;
}
function pageTitleFromSource(sourceUrl, title) {
  if (!sourceUrl) return `Cookbook:${titleClean(title)}`;
  try {
    const raw = decodeURIComponent(new URL(sourceUrl).pathname.split('/wiki/')[1] ?? '');
    return raw.replace(/_/g, ' ') || `Cookbook:${titleClean(title)}`;
  } catch { return `Cookbook:${titleClean(title)}`; }
}
async function parsePage(title, sourceUrl) {
  const page = pageTitleFromSource(sourceUrl, title);
  const params = new URLSearchParams({ action: 'parse', page, prop: 'text', format: 'json', formatversion: '2' });
  const data = await json(`${WIKIBOOKS_API}?${params}`);
  if (data?.parse?.text) return { ...data.parse, resolvedPage: page };
  const search = new URLSearchParams({ action: 'query', list: 'search', srsearch: `intitle:${titleClean(title)}`, srnamespace: '0', srlimit: '8', format: 'json', formatversion: '2' });
  const hits = (await json(`${WIKIBOOKS_API}?${search}`))?.query?.search ?? [];
  for (const hit of hits) {
    const candidate = hit?.title;
    if (!candidate) continue;
    const retry = new URLSearchParams({ action: 'parse', page: candidate, prop: 'text', format: 'json', formatversion: '2' });
    const parsed = (await json(`${WIKIBOOKS_API}?${retry}`))?.parse;
    if (parsed?.text) return { ...parsed, resolvedPage: candidate };
  }
  return { text: '', resolvedPage: page };
}
function sectionHtml(html = '') {
  const source = String(html);
  const headingPattern = /<h[2-6][^>]*>[\\s\\S]*?<span[^>]*>([\\s\\S]*?)<\\/span>[\\s\\S]*?<\\/h[2-6]>|<h[2-6][^>]*>([\\s\\S]*?)<\\/h[2-6]>/gi;
  const matches = [...source.matchAll(headingPattern)];
  for (let i = 0; i < matches.length; i += 1) {
    const rawName = clean(matches[i][1] ?? matches[i][2] ?? '');
    if (!SECTION_RE.test(rawName)) continue;
    const start = matches[i].index + matches[i][0].length;
    const end = matches[i + 1]?.index ?? source.length;
    return source.slice(start, end);
  }
  return '';
}
function imageRefs(html = '') {
  const refs = [];
  const seen = new Set();
  const source = String(html);
  const anchorPattern = /<a\\s+[^>]*href=["']\\/wiki\\/(?:File|Image)(?::|%3A|%253A)([^"'#]+)[^"']*["'][^>]*>[\\s\\S]*?<\\/a>/gi;
  for (const match of source.matchAll(anchorPattern)) {
    const file = decodeURIComponent(clean(match[1]).replace(/_/g, ' '));
    if (!file || seen.has(file)) continue;
    const context = match[0];
    const alt = clean((context.match(/alt=["']([^"']*)["']/i)?.[1]) ?? '');
    const caption = clean((context.match(/title=["']([^"']*)["']/i)?.[1]) ?? alt);
    seen.add(file);
    refs.push({ file: `File:${file}`, caption });
  }
  const imgPattern = /<img\\s+[^>]*(?:data-image-name|alt)=["']([^"']+)["'][^>]*>/gi;
  for (const match of source.matchAll(imgPattern)) {
    const candidate = clean(match[1]);
    if (!candidate || /https?:\\/\\//i.test(candidate)) continue;
    const file = candidate.startsWith('File:') ? candidate.slice(5) : candidate;
    if (seen.has(file)) continue;
    seen.add(file);
    refs.push({ file: `File:${file}`, caption: candidate });
  }
  return refs;
}
async function imageInfo(fileTitle) {
  const params = new URLSearchParams({ action: 'query', titles: fileTitle, prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1600', format: 'json', formatversion: '2' });
  const info = (await json(`${WIKIBOOKS_API}?${params}`))?.query?.pages?.[0]?.imageinfo?.[0];
  if (!info?.url) return null;
  const approved = license(info.extmetadata ?? {});
  if (!approved || !/^image\\/(jpeg|png|webp)$/i.test(info.mime ?? '')) return null;
  return { url: info.thumburl || info.url, sourceUrl: info.descriptionurl || info.url, license: approved, attribution: clean(info.extmetadata?.Artist?.value || info.extmetadata?.Credit?.value || 'Wikimedia contributor'), width: Number(info.width || 0), height: Number(info.height || 0) };
}
async function convert(input, target) {
  for (const [width, quality] of [[1200, 84], [900, 72], [700, 60], [560, 50]]) {
    const image = await sharp(input, { failOn: 'none' }).rotate().resize({ width, height: width, fit: 'inside', withoutEnlargement: true }).webp({ quality, effort: 5 }).toBuffer();
    if (image.length <= 64 * 1024 || width === 560) { await writeFile(target, image); return image.length; }
  }
  throw new Error('Unable to satisfy WebP size budget');
}
async function cleanLegacyRecipeDir(title) {
  const dir = path.join(MEDIA_ROOT, slug(title));
  if (!(await exists(dir))) return;
  for (const entry of await readdir(dir, { withFileTypes: true })) if (entry.name !== 'stages') await rm(path.join(dir, entry.name), { recursive: true, force: true });
}
function chooseFinal(infos) {
  const explicit = infos.filter(({ ref }) => /finally|done!?$|finished|ready|served|serving|plated|presentation|completed/i.test(clean(ref.caption).toLowerCase()));
  return explicit.at(-1) ?? (infos.length >= 4 ? infos.at(-1) : null);
}
async function mirror(item) {
  await cleanLegacyRecipeDir(item.title);
  const parsed = await parsePage(item.title, item.sourceUrl);
  const html = parsed?.text ?? '';
  const method = sectionHtml(html);
  const refs = imageRefs(method);
  const infos = [];
  for (const ref of refs) { try { const info = await imageInfo(ref.file); if (info && info.width >= 300 && info.height >= 300) infos.push({ ref, info }); } catch {} }
  const final = chooseFinal(infos);
  const processPool = infos.filter((x) => !final || x.info.sourceUrl !== final.info.sourceUrl);
  const process = processPool.slice(0, REQUIRED_PROCESS);
  const selected = process.map((x, i) => ({ ...x.info, caption: x.ref.caption, stage: `process-${i + 1}`, position: i + 1, evidence: 'recipe-step-section-image' }));
  if (final) selected.push({ ...final.info, caption: final.ref.caption, stage: 'final', position: REQUIRED_TOTAL, evidence: /finally|done!?$|finished|ready|served|serving|plated|presentation|completed/i.test(clean(final.ref.caption).toLowerCase()) ? 'recipe-step-final-caption' : 'recipe-step-final-position' });
  const dir = path.join(MEDIA_ROOT, slug(item.title), 'stages');
  await mkdir(dir, { recursive: true });
  const media = [];
  for (const selectedItem of selected) {
    try {
      const input = await fetchBytes(selectedItem.url);
      const digest = hash(input);
      const target = path.join(dir, `${String(selectedItem.position).padStart(2, '0')}-${selectedItem.stage}-${digest.slice(0, 12)}.webp`);
      const sizeBytes = await convert(input, target);
      media.push({ position: selectedItem.position, stage: selectedItem.stage, caption: selectedItem.caption, localPath: path.relative(ROOT, target).split(path.sep).join('/'), objectKey: path.relative(path.join(ROOT, 'media'), target).split(path.sep).join('/'), sourceUrl: selectedItem.sourceUrl, downloadUrl: selectedItem.url, sha256: digest, sizeBytes, format: 'webp', provider: 'Wikimedia Commons/Wikibooks', license: selectedItem.license, attribution: selectedItem.attribution, status: 'ready', evidence: selectedItem.evidence });
    } catch (error) { media.push({ position: selectedItem.position, stage: selectedItem.stage, caption: selectedItem.caption, sourceUrl: selectedItem.sourceUrl, status: 'failed', error: error instanceof Error ? error.message : String(error) }); }
  }
  const processReady = media.filter((x) => x.status === 'ready' && x.stage.startsWith('process-')).length;
  const finalReady = media.some((x) => x.status === 'ready' && x.stage === 'final');
  return { media, mediaCount: media.filter((x) => x.status === 'ready').length, stageStatus: processReady === REQUIRED_PROCESS && finalReady ? 'complete' : 'incomplete', resolvedPage: parsed.resolvedPage, stageRequirement: { processImages: REQUIRED_PROCESS, finalImage: 1 }, sourceEvidence: { sectionFound: Boolean(method), stepSectionImagesFound: refs.length, approvedStepImages: infos.length, finalCaption: final?.ref.caption ?? null } };
}
function datasetRow(row) {
  const data = row?.recipe_data ?? row ?? {};
  const title = titleClean(data.title || row.title || row.filename?.split('/').pop()?.replace(/\\.html$/i, '') || '');
  return { title, sourceUrl: data.url || null, ingredients: Array.isArray(data.text_lines) ? data.text_lines.filter((x) => x?.line_type === 'ul' && /ingredient/i.test(x.section || '')).length : 0, steps: Array.isArray(data.text_lines) ? data.text_lines.filter((x) => x?.line_type === 'ol').length : 0 };
}
async function main() {
  const dataset = await json(DATASET_URL);
  if (!Array.isArray(dataset) || dataset.length === 0) throw new Error('Recipe dataset is invalid');
  const rows = (MAX_RECIPES ? dataset.slice(0, MAX_RECIPES) : dataset).map(datasetRow).filter((x) => x.title);
  let manifest = { schemaVersion: 9, generatedAt: null, root: ROOT, requiredMediaPerItem: REQUIRED_TOTAL, items: {} };
  if (await exists(MANIFEST_PATH)) { try { manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8')); } catch {} }
  let cursor = 0; let done = 0;
  const worker = async () => { while (cursor < rows.length) { const item = rows[cursor++]; const key = `recipe:${slug(item.title)}`; try { const result = await mirror(item); manifest.items[key] = { kind: 'recipe', name: item.title, slug: slug(item.title), sourceUrl: item.sourceUrl, ingredients: item.ingredients, steps: item.steps, ...result, legacyImagesRemoved: true }; } catch (error) { manifest.items[key] = { kind: 'recipe', name: item.title, slug: slug(item.title), sourceUrl: item.sourceUrl, stageStatus: 'failed', media: [], mediaCount: 0, legacyImagesRemoved: true, error: error instanceof Error ? error.message : String(error) }; } done += 1; const current = manifest.items[key]; await saveJson(MANIFEST_PATH, { ...manifest, schemaVersion: 9, generatedAt: new Date().toISOString() }); console.log(`[recipe-stage-v4] ${done}/${rows.length} '${item.title}' status=${current.stageStatus} process=${current.media.filter((x) => x.status === 'ready' && x.stage.startsWith('process-')).length}/3 final=${current.media.some((x) => x.status === 'ready' && x.stage === 'final') ? 1 : 0} section=${current.sourceEvidence?.sectionFound ? 'yes' : 'no'} images=${current.sourceEvidence?.approvedStepImages ?? 0}`); } };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const recipes = Object.values(manifest.items).filter((x) => x.kind === 'recipe');
  const complete = recipes.filter((x) => x.stageStatus === 'complete').length;
  const report = { schemaVersion: 8, generatedAt: new Date().toISOString(), root: ROOT, required: { processImages: REQUIRED_PROCESS, finalImage: 1, total: REQUIRED_TOTAL }, datasetRows: dataset.length, recipesProcessed: recipes.length, complete, incomplete: recipes.length - complete };
  await saveJson(path.join(ROOT, 'recipe-stage-summary.json'), report);
  console.log(JSON.stringify(report, null, 2));
  if (recipes.length && complete < recipes.length) process.exitCode = 2;
}
main().catch((error) => { console.error(error); process.exit(1); });
