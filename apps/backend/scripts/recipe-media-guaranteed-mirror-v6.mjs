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
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const REQUIRED_PROCESS = 3;
const REQUIRED_TOTAL = 4;
const MAX_RECIPES = Number.isFinite(Number(process.env.RECIPE_STAGE_MAX)) && Number(process.env.RECIPE_STAGE_MAX) > 0 ? Math.floor(Number(process.env.RECIPE_STAGE_MAX)) : null;
const CONCURRENCY = Math.min(4, Math.max(1, Number(process.env.RECIPE_STAGE_CONCURRENCY ?? 2)));
const USER_AGENT = 'MYPA-recipe-guaranteed-media/6.0 (content pipeline)';
const MIN_PHOTO_SCORE = 5;

const clean = (value = '') => String(value)
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/\\s+/g, ' ')
  .trim();
const titleClean = (value = '') => clean(value).replace(/^["']+|["']+$/g, '').trim();
const slug = (value) => titleClean(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9\\s-]/g, '').replace(/\\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || createHash('sha1').update(titleClean(value)).digest('hex').slice(0, 12);
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

function tokens(text) {
  return new Set(clean(text).toLowerCase().replace(/[^a-z0-9\\s]/g, ' ').split(/\\s+/).filter((x) => x.length >= 3));
}
function scoreCandidate(query, candidateText) {
  const q = tokens(query); const c = tokens(candidateText); let score = 0;
  for (const token of q) if (c.has(token)) score += token.length >= 6 ? 2 : 1;
  if (/food|recipe|cooking|cook|dish|cake|bread|sauce|soup|pasta|rice|meat|fish|vegetable|batter|dough|pan|oven|boil|fry|mix|chop|slice|cut|serve|plate/i.test(candidateText)) score += 1;
  return score;
}

function parseRecipe(row) {
  const data = row?.recipe_data ?? row ?? {};
  const lines = Array.isArray(data.text_lines) ? data.text_lines : [];
  const title = titleClean(data.title || row.title || row.filename?.split('/').pop()?.replace(/\\.html$/i, '') || 'Untitled Recipe');
  const sourceUrl = data.url || `https://en.wikibooks.org/wiki/Cookbook:${encodeURIComponent(title.replace(/ /g, '_'))}`;
  const ingredients = lines.filter((x) => x?.line_type === 'ul' && /ingredient/i.test(x.section || '')).map((x) => clean(x.text)).filter(Boolean);
  const steps = lines.filter((x) => x?.line_type === 'ol').map((x) => clean(x.text)).filter((x) => x.length >= 10);
  return { title, sourceUrl, ingredients, steps };
}
function chooseThreeSteps(steps) {
  if (!steps.length) return [];
  if (steps.length === 1) return [steps[0], steps[0], steps[0]];
  if (steps.length === 2) return [steps[0], steps[1], steps[1]];
  return [steps[0], steps[Math.floor((steps.length - 1) / 2)], steps[steps.length - 1]];
}

async function parsePageImages(sourceUrl, title) {
  let page;
  try { page = decodeURIComponent(new URL(sourceUrl).pathname.split('/wiki/')[1] || '') || `Cookbook:${title}`; } catch { page = `Cookbook:${title}`; }
  const params = new URLSearchParams({ action: 'parse', page, prop: 'images', format: 'json', formatversion: '2' });
  const parsed = (await json(`${WIKIBOOKS_API}?${params}`))?.parse;
  const names = Array.isArray(parsed?.images) ? parsed.images : [];
  const results = [];
  for (const name of names.slice(0, 30)) {
    if (/icon|logo|flag|difficulty/i.test(name) || !/\\.(jpe?g|png|webp)$/i.test(name)) continue;
    const infoParams = new URLSearchParams({ action: 'query', titles: `File:${name}`, prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1600', format: 'json', formatversion: '2' });
    const info = (await json(`${WIKIBOOKS_API}?${infoParams}`))?.query?.pages?.[0]?.imageinfo?.[0];
    const approved = license(info?.extmetadata ?? {});
    if (!info?.url || !approved || Number(info.width || 0) < 500 || Number(info.height || 0) < 500) continue;
    results.push({ url: info.thumburl || info.url, sourceUrl: info.descriptionurl || info.url, license: approved, attribution: clean(info.extmetadata?.Artist?.value || info.extmetadata?.Credit?.value || 'Wikimedia contributor'), title: name, score: scoreCandidate(title, name) });
  }
  return results.sort((a, b) => b.score - a.score);
}

async function commonsSearch(query, limit = 12) {
  const params = new URLSearchParams({ action: 'query', list: 'search', srnamespace: '6', srsearch: query, srlimit: String(limit), srwhat: 'text', format: 'json', formatversion: '2' });
  const hits = (await json(`${COMMONS_API}?${params}`))?.query?.search ?? [];
  const out = [];
  for (const hit of hits) {
    const title = hit?.title;
    if (!title || !/^File:/i.test(title) || /\\.(svg|gif|ico)$/i.test(title)) continue;
    const detail = new URLSearchParams({ action: 'query', titles: title, prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1600', format: 'json', formatversion: '2' });
    const info = (await json(`${COMMONS_API}?${detail}`))?.query?.pages?.[0]?.imageinfo?.[0];
    const approved = license(info?.extmetadata ?? {});
    if (!info?.url || !approved || !/^image\\/(jpeg|png|webp)$/i.test(info.mime ?? '') || Number(info.width || 0) < 500 || Number(info.height || 0) < 500) continue;
    const text = `${title} ${hit.snippet || ''}`;
    out.push({ url: info.thumburl || info.url, sourceUrl: info.descriptionurl || info.url, license: approved, attribution: clean(info.extmetadata?.Artist?.value || info.extmetadata?.Credit?.value || 'Wikimedia contributor'), title: title.replace(/^File:/i, ''), score: scoreCandidate(query, text) });
  }
  return out.sort((a, b) => b.score - a.score);
}

async function downloadAndConvert(url, target) {
  const input = await fetchBytes(url);
  for (const [width, quality] of [[1200, 84], [1000, 76], [820, 68], [680, 58], [560, 50]]) {
    const image = await sharp(input, { failOn: 'none' }).rotate().resize({ width, height: width, fit: 'inside', withoutEnlargement: true }).webp({ quality, effort: 5 }).toBuffer();
    if (image.length <= 64 * 1024 || width === 560) { await writeFile(target, image); return { sizeBytes: image.length, digest: sha256(input) }; }
  }
  throw new Error('Unable to satisfy WebP size budget');
}

function escapeXml(value) { return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'); }
function wrapText(text, maxChars) {
  const words = clean(text).split(' '); const lines = []; let line = '';
  for (const word of words) { const next = line ? `${line} ${word}` : word; if (next.length > maxChars && line) { lines.push(line); line = word; } else line = next; }
  if (line) lines.push(line); return lines.slice(0, 6);
}
async function generateFallback({ title, step, stage, target }) {
  const lines = wrapText(step, 34);
  const icon = /bake|oven|roast/i.test(step) ? 'OVEN' : /fry|saute|sauté|pan|skillet/i.test(step) ? 'PAN' : /boil|simmer|cook/i.test(step) ? 'POT' : /chop|slice|dice|mince|cut/i.test(step) ? 'CUT' : /pour|add|sprinkle|season/i.test(step) ? 'ADD' : 'MIX';
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><rect width="1200" height="900" rx="48" fill="#F7F5EF"/><text x="70" y="92" font-family="Arial" font-size="28" font-weight="700" fill="#6B7280">MYPA RECIPE PROCESS</text><text x="70" y="155" font-family="Arial" font-size="44" font-weight="800" fill="#172033">${escapeXml(title).slice(0,48)}</text><text x="70" y="205" font-family="Arial" font-size="30" font-weight="700" fill="#4B5563">Stage ${stage} of 3 • ${icon}</text><circle cx="930" cy="300" r="175" fill="#E9EEF5"/><rect x="750" y="520" width="360" height="170" rx="28" fill="#FFFFFF" stroke="#D9DEE7" stroke-width="4"/><text x="790" y="575" font-family="Arial" font-size="26" font-weight="700" fill="#6B7280">RECIPE STEP</text>${lines.map((line,i)=>`<text x="790" y="${620+i*34}" font-family="Arial" font-size="24" fill="#172033">${escapeXml(line)}</text>`).join('')}<rect x="70" y="300" width="610" height="390" rx="34" fill="#FFFFFF" stroke="#D9DEE7" stroke-width="4"/><text x="110" y="360" font-family="Arial" font-size="28" font-weight="700" fill="#6B7280">WHAT TO DO</text>${lines.map((line,i)=>`<text x="110" y="${425+i*48}" font-family="Arial" font-size="32" font-weight="600" fill="#172033">${escapeXml(line)}</text>`).join('')}<text x="70" y="815" font-family="Arial" font-size="23" fill="#6B7280">Generated from the recipe procedure because no sufficiently relevant free photo was found.</text></svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  for (const quality of [82, 64, 50]) { const webp = await sharp(png).webp({ quality, effort: 5 }).toBuffer(); if (webp.length <= 64 * 1024 || quality === 50) { await writeFile(target, webp); return webp.length; } }
  throw new Error('Fallback generation failed');
}

async function mirror(item) {
  const dir = path.join(MEDIA_ROOT, slug(item.title), 'stages');
  await mkdir(dir, { recursive: true });
  for (const entry of await readdir(path.dirname(dir), { withFileTypes: true }).catch(() => [])) if (entry.name !== 'stages') await rm(path.join(path.dirname(dir), entry.name), { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const chosenSteps = chooseThreeSteps(item.steps);
  if (!chosenSteps.length) throw new Error('Recipe has no usable procedure steps');
  const media = [];
  for (let index = 0; index < REQUIRED_PROCESS; index += 1) {
    const step = chosenSteps[index];
    const target = path.join(dir, `${String(index + 1).padStart(2, '0')}-process-${index + 1}.webp`);
    const query = `${item.title} ${step}`;
    let candidate = null;
    try {
      const results = await commonsSearch(query, 12);
      candidate = results.find((x) => x.score >= MIN_PHOTO_SCORE && !media.some((m) => m.sourceUrl === x.sourceUrl)) ?? null;
    } catch {}
    if (candidate) {
      try {
        const converted = await downloadAndConvert(candidate.url, target);
        media.push({ position: index + 1, stage: `process-${index + 1}`, localPath: path.relative(ROOT, target).split(path.sep).join('/'), objectKey: path.relative(path.join(ROOT, 'media'), target).split(path.sep).join('/'), sizeBytes: converted.sizeBytes, sha256: converted.digest, format: 'webp', provider: 'Wikimedia Commons semantic search', sourceUrl: candidate.sourceUrl, license: candidate.license, attribution: candidate.attribution, caption: candidate.title, status: 'ready', evidence: 'commons-step-search', query, relevanceScore: candidate.score, step });
        continue;
      } catch {}
    }
    const sizeBytes = await generateFallback({ title: item.title, step, stage: index + 1, target });
    media.push({ position: index + 1, stage: `process-${index + 1}`, localPath: path.relative(ROOT, target).split(path.sep).join('/'), objectKey: path.relative(path.join(ROOT, 'media'), target).split(path.sep).join('/'), sizeBytes, format: 'webp', provider: 'MYPA deterministic recipe-step illustration', license: 'Generated', attribution: 'MYPA', status: 'ready', evidence: 'recipe-procedure-derived-fallback', query, step });
  }
  const finalTarget = path.join(dir, '04-final.webp');
  let finalSource = null;
  try { finalSource = (await parsePageImages(item.sourceUrl, item.title))[0] ?? null; } catch {}
  if (!finalSource) { try { finalSource = (await commonsSearch(`${item.title} finished dish`, 12)).find((x) => x.score >= Math.max(MIN_PHOTO_SCORE, 6)); } catch {} }
  if (finalSource) {
    try {
      const converted = await downloadAndConvert(finalSource.url, finalTarget);
      media.push({ position: 4, stage: 'final', localPath: path.relative(ROOT, finalTarget).split(path.sep).join('/'), objectKey: path.relative(path.join(ROOT, 'media'), finalTarget).split(path.sep).join('/'), sizeBytes: converted.sizeBytes, sha256: converted.digest, format: 'webp', provider: finalSource.sourceUrl.includes('wikimedia') || finalSource.sourceUrl.includes('commons') ? 'Wikimedia Commons semantic search' : 'Wikimedia Commons/Wikibooks', sourceUrl: finalSource.sourceUrl, license: finalSource.license, attribution: finalSource.attribution, caption: finalSource.title, status: 'ready', evidence: finalSource.sourceUrl.includes('commons') ? 'commons-final-search' : 'licensed-recipe-page-image' });
    } catch {}
  }
  if (!media.some((x) => x.stage === 'final')) {
    const sizeBytes = await generateFallback({ title: item.title, step: `Finished dish: ${item.title}`, stage: 4, target: finalTarget });
    media.push({ position: 4, stage: 'final', localPath: path.relative(ROOT, finalTarget).split(path.sep).join('/'), objectKey: path.relative(path.join(ROOT, 'media'), finalTarget).split(path.sep).join('/'), sizeBytes, format: 'webp', provider: 'MYPA deterministic recipe final illustration', license: 'Generated', attribution: 'MYPA', status: 'ready', evidence: 'recipe-derived-final-fallback' });
  }
  return { media, mediaCount: media.length, stageStatus: media.length === REQUIRED_TOTAL && media.every((x) => x.status === 'ready') ? 'complete' : 'incomplete', stageRequirement: { processImages: REQUIRED_PROCESS, finalImage: 1 }, sourceEvidence: { procedureStepsAvailable: item.steps.length, processRealPhotos: media.filter((x) => x.stage.startsWith('process-') && x.provider.includes('Wikimedia')).length, finalRealPhoto: media.some((x) => x.stage === 'final' && x.license !== 'Generated') }, mediaPolicy: '3 semantic step images + 1 final image; free licensed photos preferred, deterministic recipe-derived fallback otherwise' };
}

async function main() {
  const dataset = await json(DATASET_URL);
  if (!Array.isArray(dataset) || dataset.length === 0) throw new Error('Recipe dataset is invalid');
  const rows = (MAX_RECIPES ? dataset.slice(0, MAX_RECIPES) : dataset).map(parseRecipe).filter((x) => x.title && x.title !== 'Untitled Recipe');
  let manifest = { schemaVersion: 11, generatedAt: null, root: ROOT, requiredMediaPerItem: REQUIRED_TOTAL, items: {} };
  if (await exists(MANIFEST_PATH)) { try { manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8')); } catch {} }
  let cursor = 0; let done = 0;
  const worker = async () => { while (cursor < rows.length) { const item = rows[cursor++]; const key = `recipe:${slug(item.title)}`; try { const result = await mirror(item); manifest.items[key] = { kind: 'recipe', name: item.title, slug: slug(item.title), sourceUrl: item.sourceUrl, ingredients: item.ingredients.length, steps: item.steps.length, ...result, legacyImagesRemoved: true }; } catch (error) { manifest.items[key] = { kind: 'recipe', name: item.title, slug: slug(item.title), sourceUrl: item.sourceUrl, stageStatus: 'failed', media: [], mediaCount: 0, legacyImagesRemoved: true, error: error instanceof Error ? error.message : String(error) }; } done += 1; const current = manifest.items[key]; await saveJson(MANIFEST_PATH, { ...manifest, schemaVersion: 11, generatedAt: new Date().toISOString() }); console.log(`[recipe-guaranteed-v6] ${done}/${rows.length} '${item.title}' status=${current.stageStatus} process=${current.media.filter((x) => x.status === 'ready' && x.stage.startsWith('process-')).length}/3 photoProcess=${current.media.filter((x) => x.stage.startsWith('process-') && x.license !== 'Generated').length} final=${current.media.some((x) => x.status === 'ready' && x.stage === 'final') ? 1 : 0} finalType=${current.media.find((x) => x.stage === 'final')?.license === 'Generated' ? 'illustration' : 'photo'}`); } };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const recipes = Object.values(manifest.items).filter((x) => x.kind === 'recipe');
  const complete = recipes.filter((x) => x.stageStatus === 'complete').length;
  const report = { schemaVersion: 9, generatedAt: new Date().toISOString(), root: ROOT, required: { processImages: REQUIRED_PROCESS, finalImage: 1, total: REQUIRED_TOTAL }, recipes: recipes.length, complete, incomplete: recipes.length - complete, mediaPolicy: 'Every recipe receives 3 semantic process images and 1 final image. Licensed real photos are preferred; a deterministic recipe-derived illustration is used only when no sufficiently relevant free photo is available.' };
  await saveJson(SUMMARY_PATH, report);
  console.log(JSON.stringify(report, null, 2));
  if (recipes.length && complete < recipes.length) process.exitCode = 2;
}
main().catch((error) => { console.error(error); process.exit(1); });
