#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, rename, rm, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(process.env.MYPA_CONTENT_MIRROR_ROOT ?? path.join(process.cwd(), 'content-mirror'));
const MEDIA_ROOT = path.join(ROOT, 'media', 'recipes');
const MANIFEST_PATH = path.join(ROOT, 'manifest.json');
const SUMMARY_PATH = path.join(ROOT, 'recipe-stage-summary.json');
const DATASET_URL = process.env.RECIPE_DATASET_URL ?? 'https://huggingface.co/datasets/gossminn/wikibooks-cookbook/resolve/main/recipes_parsed.json?download=true';
const WIKIBOOKS_API = 'https://en.wikibooks.org/w/api.php';
const REQUIRED_PROCESS = 3;
const REQUIRED_TOTAL = 4;
const MAX_RECIPES = Number.isFinite(Number(process.env.RECIPE_STAGE_MAX)) && Number(process.env.RECIPE_STAGE_MAX) > 0 ? Math.floor(Number(process.env.RECIPE_STAGE_MAX)) : null;
const CONCURRENCY = Math.min(4, Math.max(1, Number(process.env.RECIPE_STAGE_CONCURRENCY ?? 2)));
const USER_AGENT = 'MYPA-recipe-guaranteed-media/5.0';

const clean = (value = '') => String(value)
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/\s+/g, ' ')
  .trim();

const titleClean = (value = '') => clean(value).replace(/^["']+|["']+$/g, '').trim();
const slug = (value) => titleClean(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || createHash('sha1').update(titleClean(value)).digest('hex').slice(0, 12);
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

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
async function saveJson(file, value) { await mkdir(path.dirname(file), { recursive: true }); const tmp = `${file}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`; await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); await rename(tmp, file); }

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

function parseRecipe(row) {
  const data = row?.recipe_data ?? row ?? {};
  const lines = Array.isArray(data.text_lines) ? data.text_lines : [];
  const title = titleClean(data.title || row.title || row.filename?.split('/').pop()?.replace(/\.html$/i, '') || 'Untitled Recipe');
  const sourceUrl = data.url || `https://en.wikibooks.org/wiki/Cookbook:${encodeURIComponent(title.replace(/ /g, '_'))}`;
  const ingredients = lines
    .filter((line) => line?.line_type === 'ul' && /ingredient/i.test(line.section || ''))
    .map((line) => clean(line.text))
    .filter(Boolean);
  const steps = lines
    .filter((line) => line?.line_type === 'ol')
    .map((line) => clean(line.text))
    .filter((step) => step.length >= 10);
  return { title, sourceUrl, ingredients, steps };
}

function pickSteps(steps) {
  if (steps.length <= 3) return steps;
  const indexes = [0, Math.floor((steps.length - 1) / 2), steps.length - 1];
  return indexes.map((index) => steps[index]);
}

function escapeXml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function wrapText(text, maxChars) {
  const words = clean(text).split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines.slice(0, 6);
}

function actionIcon(step = '') {
  const text = step.toLowerCase();
  if (/bake|oven|roast/.test(text)) return 'oven';
  if (/fry|saute|sauté|pan|skillet/.test(text)) return 'pan';
  if (/boil|simmer|cook/.test(text)) return 'pot';
  if (/mix|stir|beat|whisk|fold|combine/.test(text)) return 'bowl';
  if (/chop|slice|dice|mince|cut/.test(text)) return 'knife';
  if (/pour|add|sprinkle|season/.test(text)) return 'pour';
  return 'bowl';
}

function iconSvg(kind) {
  const common = 'fill="none" stroke="#253247" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"';
  if (kind === 'knife') return `<path ${common} d="M180 300 L430 80 L520 170 L270 420 Z"/><path ${common} d="M300 380 L430 510"/><path ${common} d="M430 80 L630 280"/>`;
  if (kind === 'oven') return `<rect ${common} x="180" y="100" width="440" height="420" rx="35"/><rect ${common} x="240" y="210" width="320" height="210" rx="20"/><circle ${common} cx="280" cy="155" r="12"/><circle ${common} cx="340" cy="155" r="12"/>`;
  if (kind === 'pan') return `<ellipse ${common} cx="330" cy="270" rx="190" ry="95"/><path ${common} d="M490 250 L690 140"/><path ${common} d="M180 330 Q300 470 480 330"/>`;
  if (kind === 'pot') return `<rect ${common} x="210" y="210" width="300" height="260" rx="35"/><path ${common} d="M160 210 H560"/><path ${common} d="M260 150 H460"/><path ${common} d="M180 260 H120"/><path ${common} d="M590 260 H530"/>`;
  if (kind === 'pour') return `<path ${common} d="M230 170 H470 L430 480 H270 Z"/><path ${common} d="M490 190 Q610 230 540 320"/><path ${common} d="M470 350 C540 400 610 400 650 350"/>`;
  return `<path ${common} d="M150 250 Q400 470 650 250"/><path ${common} d="M170 240 Q400 130 630 240"/><path ${common} d="M260 220 C290 180 330 180 360 220"/><path ${common} d="M390 220 C420 180 460 180 490 220"/>`;
}

async function generateProcessImage({ title, step, stage, target }) {
  const icon = actionIcon(step);
  const action = wrapText(step, 34);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <rect width="1200" height="900" rx="48" fill="#F7F5EF"/>
  <text x="70" y="92" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="#6B7280">MYPA RECIPE PROCESS</text>
  <text x="70" y="155" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="800" fill="#172033">${escapeXml(title).slice(0, 48)}</text>
  <text x="70" y="205" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="#4B5563">Stage ${stage} of 3</text>
  <circle cx="910" cy="290" r="180" fill="#E9EEF5"/>
  <g transform="translate(710 90) scale(.65)">${iconSvg(icon)}</g>
  <rect x="70" y="300" width="710" height="430" rx="34" fill="#FFFFFF" stroke="#D9DEE7" stroke-width="4"/>
  <text x="110" y="355" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="#6B7280">WHAT HAPPENS</text>
  ${action.map((line, i) => `<text x="110" y="${420 + i * 54}" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="600" fill="#172033">${escapeXml(line)}</text>`).join('')}
  <text x="70" y="815" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#6B7280">Generated directly from the recipe's own procedure step.</text>
</svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  let webp = await sharp(png).webp({ quality: 82, effort: 5 }).toBuffer();
  if (webp.length > 64 * 1024) webp = await sharp(png).webp({ quality: 62, effort: 5 }).toBuffer();
  await writeFile(target, webp);
  return webp.length;
}

async function parsePageImages(item) {
  const page = (() => { try { return decodeURIComponent(new URL(item.sourceUrl).pathname.split('/wiki/')[1] ?? '') || `Cookbook:${item.title}`; } catch { return `Cookbook:${item.title}`; } })().replace(/ /g, ' ');
  const params = new URLSearchParams({ action: 'parse', page, prop: 'text|images', format: 'json', formatversion: '2' });
  const parsed = (await json(`${WIKIBOOKS_API}?${params}`))?.parse;
  const imageNames = Array.isArray(parsed?.images) ? parsed.images : [];
  const results = [];
  for (const name of imageNames.slice(0, 24)) {
    if (!/^.+\.(jpe?g|png|webp)$/i.test(name) || /icon|logo|flag|difficulty/i.test(name)) continue;
    const fileTitle = `File:${name}`;
    const infoParams = new URLSearchParams({ action: 'query', titles: fileTitle, prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1600', format: 'json', formatversion: '2' });
    const info = (await json(`${WIKIBOOKS_API}?${infoParams}`))?.query?.pages?.[0]?.imageinfo?.[0];
    if (!info?.url || Number(info.width || 0) < 500 || Number(info.height || 0) < 500) continue;
    const approved = license(info.extmetadata ?? {});
    if (!approved || !/^image\/(jpeg|png|webp)$/i.test(info.mime ?? '')) continue;
    results.push({ url: info.thumburl || info.url, sourceUrl: info.descriptionurl || info.url, license: approved, attribution: clean(info.extmetadata?.Artist?.value || info.extmetadata?.Credit?.value || 'Wikimedia contributor'), width: Number(info.width), height: Number(info.height) });
  }
  return results;
}

async function generateFinalIllustration({ title, ingredients, target }) {
  const words = clean(ingredients.slice(0, 6).join(' • ')).slice(0, 100);
  const seed = createHash('sha1').update(title).digest('hex');
  const accent1 = `#${seed.slice(0, 6)}`;
  const accent2 = `#${seed.slice(6, 12)}`;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <rect width="1200" height="900" rx="48" fill="#F7F5EF"/>
  <text x="70" y="95" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="#6B7280">MYPA RECIPE FINAL</text>
  <text x="70" y="160" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="800" fill="#172033">${escapeXml(title).slice(0, 44)}</text>
  <ellipse cx="600" cy="520" rx="320" ry="190" fill="#E4E7EC"/>
  <ellipse cx="600" cy="480" rx="265" ry="155" fill="#FFFFFF" stroke="#C9CFD8" stroke-width="8"/>
  <ellipse cx="600" cy="475" rx="210" ry="115" fill="${accent1}" opacity=".88"/>
  <circle cx="515" cy="445" r="44" fill="${accent2}"/><circle cx="600" cy="410" r="38" fill="${accent2}"/><circle cx="685" cy="455" r="42" fill="${accent2}"/>
  <circle cx="555" cy="515" r="28" fill="#FFFFFF" opacity=".78"/><circle cx="645" cy="520" r="26" fill="#FFFFFF" opacity=".78"/>
  <text x="600" y="740" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#4B5563">${escapeXml(words || 'Recipe-based final illustration')}</text>
  <text x="600" y="790" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#6B7280">Fallback illustration generated from this recipe when no reusable licensed final photo exists.</text>
</svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  let webp = await sharp(png).webp({ quality: 82, effort: 5 }).toBuffer();
  if (webp.length > 64 * 1024) webp = await sharp(png).webp({ quality: 62, effort: 5 }).toBuffer();
  await writeFile(target, webp);
  return webp.length;
}

async function downloadAndConvert(url, target) {
  const source = await fetchBytes(url);
  let image = await sharp(source, { failOn: 'none' }).rotate().resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toBuffer();
  if (image.length > 64 * 1024) image = await sharp(source, { failOn: 'none' }).rotate().resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true }).webp({ quality: 66, effort: 5 }).toBuffer();
  if (image.length > 64 * 1024) image = await sharp(source, { failOn: 'none' }).rotate().resize({ width: 700, height: 700, fit: 'inside', withoutEnlargement: true }).webp({ quality: 52, effort: 5 }).toBuffer();
  if (image.length > 64 * 1024) throw new Error('final image exceeds 64KB budget');
  await writeFile(target, image);
  return image.length;
}

async function cleanLegacyRecipeDir(title) {
  const dir = path.join(MEDIA_ROOT, slug(title));
  if (!(await exists(dir))) return;
  for (const entry of await readdir(dir, { withFileTypes: true })) if (entry.name !== 'stages') await rm(path.join(dir, entry.name), { recursive: true, force: true });
}

async function mirror(item) {
  await cleanLegacyRecipeDir(item.title);
  const steps = pickSteps(item.steps.length ? item.steps : ['Prepare the ingredients according to the recipe.', 'Cook the prepared mixture according to the recipe.', 'Finish and serve the recipe.']);
  const dir = path.join(MEDIA_ROOT, slug(item.title), 'stages');
  await mkdir(dir, { recursive: true });
  const media = [];
  for (let i = 0; i < REQUIRED_PROCESS; i += 1) {
    const target = path.join(dir, `${String(i + 1).padStart(2, '0')}-process-${i + 1}.webp`);
    const sizeBytes = await generateProcessImage({ title: item.title, step: steps[i] || steps.at(-1), stage: i + 1, target });
    media.push({ position: i + 1, stage: `process-${i + 1}`, localPath: path.relative(ROOT, target).split(path.sep).join('/'), objectKey: path.relative(path.join(ROOT, 'media'), target).split(path.sep).join('/'), sizeBytes, format: 'webp', provider: 'MYPA deterministic recipe-step illustration', license: 'Generated', attribution: 'MYPA', status: 'ready', evidence: 'recipe-procedure-step' });
  }
  let finalSource = null;
  try { finalSource = (await parsePageImages(item))[0] ?? null; } catch {}
  const finalTarget = path.join(dir, '04-final.webp');
  if (finalSource) {
    try {
      const sizeBytes = await downloadAndConvert(finalSource.url, finalTarget);
      media.push({ position: 4, stage: 'final', localPath: path.relative(ROOT, finalTarget).split(path.sep).join('/'), objectKey: path.relative(path.join(ROOT, 'media'), finalTarget).split(path.sep).join('/'), sizeBytes, format: 'webp', provider: 'Wikimedia Commons/Wikibooks', sourceUrl: finalSource.sourceUrl, license: finalSource.license, attribution: finalSource.attribution, status: 'ready', evidence: 'licensed-recipe-page-image' });
    } catch {}
  }
  if (!media.some((x) => x.stage === 'final' && x.status === 'ready')) {
    const sizeBytes = await generateFinalIllustration({ title: item.title, ingredients: item.ingredients, target: finalTarget });
    media.push({ position: 4, stage: 'final', localPath: path.relative(ROOT, finalTarget).split(path.sep).join('/'), objectKey: path.relative(path.join(ROOT, 'media'), finalTarget).split(path.sep).join('/'), sizeBytes, format: 'webp', provider: 'MYPA deterministic recipe illustration', license: 'Generated', attribution: 'MYPA', status: 'ready', evidence: 'recipe-derived-final-illustration' });
  }
  return { media, mediaCount: media.length, stageStatus: media.length === REQUIRED_TOTAL ? 'complete' : 'incomplete', stageRequirement: { processImages: REQUIRED_PROCESS, finalImage: 1 }, sourceEvidence: { procedureStepsAvailable: item.steps.length, licensedFinalPhoto: Boolean(finalSource) }, guaranteeMode: '3 deterministic procedure illustrations + licensed final photo when available, otherwise recipe-derived final illustration' };
}

async function main() {
  const dataset = await json(DATASET_URL);
  if (!Array.isArray(dataset) || dataset.length === 0) throw new Error('Recipe dataset is invalid');
  const rows = (MAX_RECIPES ? dataset.slice(0, MAX_RECIPES) : dataset).map(parseRecipe).filter((x) => x.title && x.title !== 'Untitled Recipe');
  let manifest = { schemaVersion: 10, generatedAt: null, root: ROOT, requiredMediaPerItem: REQUIRED_TOTAL, items: {} };
  if (await exists(MANIFEST_PATH)) { try { manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8')); } catch {} }
  let cursor = 0; let done = 0;
  const worker = async () => { while (cursor < rows.length) { const item = rows[cursor++]; const key = `recipe:${slug(item.title)}`; try { const result = await mirror(item); manifest.items[key] = { kind: 'recipe', name: item.title, slug: slug(item.title), sourceUrl: item.sourceUrl, ingredients: item.ingredients.length, steps: item.steps.length, ...result, legacyImagesRemoved: true }; } catch (error) { manifest.items[key] = { kind: 'recipe', name: item.title, slug: slug(item.title), sourceUrl: item.sourceUrl, stageStatus: 'failed', media: [], mediaCount: 0, legacyImagesRemoved: true, error: error instanceof Error ? error.message : String(error) }; } done += 1; const current = manifest.items[key]; await saveJson(MANIFEST_PATH, { ...manifest, schemaVersion: 10, generatedAt: new Date().toISOString() }); console.log(`[recipe-guaranteed-v5] ${done}/${rows.length} '${item.title}' status=${current.stageStatus} process=${current.media.filter((x) => x.status === 'ready' && x.stage.startsWith('process-')).length}/3 final=${current.media.some((x) => x.status === 'ready' && x.stage === 'final') ? 1 : 0} finalPhoto=${current.sourceEvidence?.licensedFinalPhoto ? 'yes' : 'illustration'}`); } };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const recipes = Object.values(manifest.items).filter((x) => x.kind === 'recipe');
  const complete = recipes.filter((x) => x.stageStatus === 'complete').length;
  const report = { schemaVersion: 8, generatedAt: new Date().toISOString(), root: ROOT, required: { processImages: REQUIRED_PROCESS, finalImage: 1, total: REQUIRED_TOTAL }, recipes: recipes.length, complete, incomplete: recipes.length - complete, mediaPolicy: 'Every recipe receives 3 recipe-step illustrations and 1 licensed final photo when available, otherwise a recipe-derived final illustration.' };
  await saveJson(SUMMARY_PATH, report);
  console.log(JSON.stringify(report, null, 2));
  if (recipes.length && complete < recipes.length) process.exitCode = 2;
}

main().catch((error) => { console.error(error); process.exit(1); });
