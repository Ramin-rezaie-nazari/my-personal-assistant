#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(process.env.MYPA_CONTENT_MIRROR_ROOT ?? path.join(process.cwd(), 'content-mirror'));
const MEDIA_ROOT = path.join(ROOT, 'media', 'recipes');
const MANIFEST_PATH = path.join(ROOT, 'recipe-final-manifest.json');
const SUMMARY_PATH = path.join(ROOT, 'recipe-final-summary.json');
const DATASET_URL = process.env.RECIPE_DATASET_URL ?? 'https://huggingface.co/datasets/gossminn/wikibooks-cookbook/resolve/main/recipes_parsed.json?download=true';
const WIKIBOOKS_API = 'https://en.wikibooks.org/w/api.php';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const MAX_BYTES = 64 * 1024;
const CONCURRENCY = Math.min(6, Math.max(1, Number(process.env.RECIPE_FINAL_CONCURRENCY ?? 4)));
const LIMIT = Number(process.env.RECIPE_FINAL_MAX ?? 0) || null;
const UA = 'MYPA-recipe-final-media/2.0';

const clean = (value = '') => String(value)
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/\s+/g, ' ')
  .trim();

const slug = (value) => clean(value).toLowerCase().normalize('NFKD')
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '') || createHash('sha1').update(clean(value)).digest('hex').slice(0, 12);

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

async function saveJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(tmp, file);
}

async function fetchBytes(url) {
  let lastError;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json,text/html,image/*,*/*;q=0.8' },
        redirect: 'follow',
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
      if (attempt < 4) await sleep(700 * 2 ** attempt);
    }
  }
  throw lastError;
}

async function fetchJson(url) {
  return JSON.parse((await fetchBytes(url)).toString('utf8'));
}

function licenseFrom(meta = {}) {
  const text = `${clean(meta.LicenseShortName?.value ?? meta.LicenseShortName ?? '')} ${clean(meta.UsageTerms?.value ?? meta.UsageTerms ?? '')}`;
  if (/non[- ]?commercial|\bNC\b|no derivatives|\bND\b/i.test(text)) return null;
  if (/CC0|public domain|public-domain|PDM/i.test(text)) return 'CC0/Public Domain';
  if (/CC BY-SA/i.test(text)) return 'CC BY-SA';
  if (/CC BY/i.test(text)) return 'CC BY';
  return null;
}

function tokens(text) {
  return new Set(clean(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((x) => x.length >= 3));
}

function finalScore(title, text) {
  const wanted = tokens(title);
  const hay = tokens(text);
  let score = 0;
  for (const token of wanted) if (hay.has(token)) score += token.length >= 6 ? 2 : 1;
  if (/finished|served|plated|dish|meal|ready to eat|prepared|cooked/i.test(text)) score += 6;
  if (/food|recipe|cookbook/i.test(text)) score += 2;
  if (/ingredient list|uncooked|raw ingredients/i.test(text)) score -= 5;
  if (/step|instruction|process|method/i.test(text)) score -= 2;
  return score;
}

async function pageImages(sourceUrl, title) {
  let pageName = `Cookbook:${title.replace(/ /g, '_')}`;
  try {
    const parsed = new URL(sourceUrl);
    const part = decodeURIComponent(parsed.pathname.split('/wiki/')[1] || '');
    if (part) pageName = part;
  } catch {}

  const params = new URLSearchParams({ action: 'parse', page: pageName, prop: 'images', format: 'json', formatversion: '2' });
  const names = (await fetchJson(`${WIKIBOOKS_API}?${params}`))?.parse?.images ?? [];
  const filtered = names.filter((name) => /\.(jpe?g|png|webp)$/i.test(name) && !/icon|logo|flag|difficulty|step/i.test(name));
  if (!filtered.length) return [];

  const details = new URLSearchParams({
    action: 'query',
    titles: filtered.slice(0, 50).map((name) => `File:${name}`).join('|'),
    prop: 'imageinfo',
    iiprop: 'url|mime|size|extmetadata',
    iiurlwidth: '1600',
    format: 'json',
    formatversion: '2',
  });
  const pages = (await fetchJson(`${WIKIBOOKS_API}?${details}`))?.query?.pages ?? [];
  return pages.map((page) => {
    const info = page?.imageinfo?.[0];
    if (!info || !/^image\/(jpeg|png|webp)$/i.test(info.mime ?? '')) return null;
    if (Number(info.width ?? 0) < 500 || Number(info.height ?? 0) < 500) return null;
    const license = licenseFrom(info.extmetadata ?? {});
    if (!license) return null;
    const text = clean(`${page.title ?? ''} ${info.extmetadata?.ObjectName?.value ?? ''} ${info.extmetadata?.ImageDescription?.value ?? ''}`);
    return {
      url: info.thumburl ?? info.url,
      sourceUrl: info.descriptionurl ?? info.url,
      provider: 'Wikimedia Commons/Wikibooks',
      license,
      attribution: clean(info.extmetadata?.Artist?.value ?? info.extmetadata?.Credit?.value ?? 'Wikimedia contributor'),
      score: finalScore(title, text),
    };
  }).filter(Boolean).sort((a, b) => b.score - a.score);
}

async function commonsImages(title) {
  const query = `${title} finished dish food recipe`;
  const params = new URLSearchParams({
    action: 'query', generator: 'search', gsrnamespace: '6', gsrsearch: query, gsrlimit: '40',
    prop: 'imageinfo', iiprop: 'url|mime|size|extmetadata', iiurlwidth: '1600', format: 'json', formatversion: '2',
  });
  const pages = (await fetchJson(`${COMMONS_API}?${params}`))?.query?.pages ?? [];
  return pages.map((page) => {
    const info = page?.imageinfo?.[0];
    if (!info || !/^image\/(jpeg|png|webp)$/i.test(info.mime ?? '')) return null;
    if (Number(info.width ?? 0) < 500 || Number(info.height ?? 0) < 500) return null;
    const license = licenseFrom(info.extmetadata ?? {});
    if (!license) return null;
    const text = clean(`${page.title ?? ''} ${info.extmetadata?.ImageDescription?.value ?? ''} ${info.extmetadata?.Categories?.value ?? ''}`);
    return {
      url: info.thumburl ?? info.url,
      sourceUrl: info.descriptionurl ?? info.url,
      provider: 'Wikimedia Commons',
      license,
      attribution: clean(info.extmetadata?.Artist?.value ?? info.extmetadata?.Credit?.value ?? 'Wikimedia contributor'),
      score: finalScore(title, text),
    };
  }).filter(Boolean).sort((a, b) => b.score - a.score);
}

function parseRecipe(row) {
  const data = row?.recipe_data ?? row ?? {};
  const lines = Array.isArray(data.text_lines) ? data.text_lines : [];
  const title = clean(data.title ?? row.title ?? row.filename?.split('/').pop()?.replace(/\.html$/i, '') ?? 'Untitled Recipe');
  const ingredients = lines.filter((line) => line?.line_type === 'ul' && /ingredient/i.test(line.section ?? ''))
    .map((line) => clean(line.text)).filter(Boolean);
  return {
    title,
    sourceUrl: data.url ?? `https://en.wikibooks.org/wiki/Cookbook:${encodeURIComponent(title.replace(/ /g, '_'))}`,
    ingredients,
  };
}

async function encodeWebp(input) {
  const attempts = [[1400,84],[1200,78],[1000,70],[900,62],[800,56],[700,50],[600,44],[500,38],[420,32],[360,28]];
  let best = null;
  for (const [width, quality] of attempts) {
    const output = await sharp(input, { failOn: 'none' }).rotate()
      .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
      .webp({ quality, effort: 5 }).toBuffer();
    best = output;
    if (output.length <= MAX_BYTES) break;
  }
  if (!best || best.length > MAX_BYTES) throw new Error('WebP size budget exceeded');
  return best;
}

function fallbackSvg(item) {
  const safe = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const ingredients = item.ingredients.slice(0, 6).join(' • ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900"><rect width="1200" height="900" rx="48" fill="#f4efe7"/><ellipse cx="600" cy="545" rx="360" ry="170" fill="#d5c3ac"/><ellipse cx="600" cy="515" rx="315" ry="135" fill="#fff"/><circle cx="510" cy="500" r="72" fill="#d78945"/><circle cx="625" cy="540" r="82" fill="#82a15a"/><circle cx="690" cy="470" r="58" fill="#c95d4d"/><text x="600" y="120" text-anchor="middle" font-family="Arial" font-size="56" font-weight="700" fill="#3d342c">${safe(item.title.slice(0,34))}</text><text x="600" y="200" text-anchor="middle" font-family="Arial" font-size="25" fill="#6a5b4d">MYPA finished-dish illustration</text><text x="600" y="770" text-anchor="middle" font-family="Arial" font-size="19" fill="#6a5b4d">${safe(ingredients.slice(0,120))}</text><text x="600" y="820" text-anchor="middle" font-family="Arial" font-size="17" fill="#8a7765">Generated only when no verified licensed final-dish photo is available</text></svg>`;
}

async function build(item, manifest) {
  const key = `recipe:${slug(item.title)}`;
  const directory = path.join(MEDIA_ROOT, slug(item.title));
  await mkdir(directory, { recursive: true });

  const previous = manifest.items[key];
  if (previous?.status === 'ready' && previous.localPath && await exists(path.join(ROOT, previous.localPath))) return previous;

  let candidates = [];
  try { candidates.push(...(await pageImages(item.sourceUrl, item.title)).filter((candidate) => candidate.score >= 7)); } catch {}
  try { candidates.push(...(await commonsImages(item.title)).filter((candidate) => candidate.score >= 7)); } catch {}
  const seen = new Set();
  candidates = candidates.filter((candidate) => {
    if (!candidate.sourceUrl || seen.has(candidate.sourceUrl)) return false;
    seen.add(candidate.sourceUrl);
    return true;
  });

  for (const candidate of candidates) {
    try {
      const original = await fetchBytes(candidate.url);
      const webp = await encodeWebp(original);
      const filename = `final-${sha256(webp).slice(0, 12)}.webp`;
      const target = path.join(directory, filename);
      await writeFile(target, webp);
      return manifest.items[key] = {
        kind: 'recipe', name: item.title, slug: slug(item.title), sourceUrl: item.sourceUrl,
        stage: 'final', mediaCount: 1, status: 'ready', format: 'webp', sizeBytes: webp.length,
        sha256: sha256(webp), localPath: path.relative(ROOT, target).split(path.sep).join('/'),
        objectKey: path.relative(MEDIA_ROOT, target).split(path.sep).join('/'), provider: candidate.provider,
        license: candidate.license, attribution: candidate.attribution, sourceMediaUrl: candidate.sourceUrl,
        sourceType: 'licensed-real', generated: false,
      };
    } catch {}
  }

  const webp = await encodeWebp(Buffer.from(fallbackSvg(item)));
  const target = path.join(directory, 'final-generated.webp');
  await writeFile(target, webp);
  return manifest.items[key] = {
    kind: 'recipe', name: item.title, slug: slug(item.title), sourceUrl: item.sourceUrl,
    stage: 'final', mediaCount: 1, status: 'ready', format: 'webp', sizeBytes: webp.length,
    sha256: sha256(webp), localPath: path.relative(ROOT, target).split(path.sep).join('/'),
    objectKey: path.relative(MEDIA_ROOT, target).split(path.sep).join('/'), provider: 'MYPA deterministic renderer',
    license: 'generated-original', attribution: 'MYPA', sourceType: 'recipe-derived-generated', generated: true,
    basedOnRecipe: true,
  };
}

async function main() {
  await mkdir(MEDIA_ROOT, { recursive: true });
  let manifest = { schemaVersion: 2, generatedAt: null, requiredMediaPerRecipe: 1, items: {} };
  if (await exists(MANIFEST_PATH)) { try { manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8')); } catch {} }

  const dataset = await fetchJson(DATASET_URL);
  if (!Array.isArray(dataset)) throw new Error('Recipe dataset is invalid');
  const rows = LIMIT ? dataset.slice(0, LIMIT) : dataset;
  let cursor = 0;
  let processed = 0;

  const worker = async () => {
    while (true) {
      const index = cursor++;
      if (index >= rows.length) return;
      const item = parseRecipe(rows[index]);
      try {
        await build(item, manifest);
      } catch (error) {
        manifest.items[`recipe:${slug(item.title)}`] = {
          kind: 'recipe', name: item.title, slug: slug(item.title), sourceUrl: item.sourceUrl,
          status: 'failed', mediaCount: 0, error: error instanceof Error ? error.message : String(error),
        };
      }
      processed += 1;
      if (processed % 25 === 0) console.log(`[recipes-final] ${processed}/${rows.length}`);
      await saveJson(MANIFEST_PATH, manifest);
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  manifest.generatedAt = new Date().toISOString();
  await saveJson(MANIFEST_PATH, manifest);

  const items = Object.values(manifest.items);
  const complete = items.filter((item) => item.status === 'ready' && item.stage === 'final' && item.mediaCount === 1 && item.format === 'webp' && item.sizeBytes > 0 && item.sizeBytes <= MAX_BYTES).length;
  const summary = {
    schemaVersion: 2, generatedAt: manifest.generatedAt, root: ROOT, requiredMediaPerRecipe: 1,
    recipes: items.length, complete, incomplete: items.length - complete, failed: items.filter((item) => item.status === 'failed').length,
    licensed: items.filter((item) => item.generated === false).length, generated: items.filter((item) => item.generated === true).length,
    maxBytes: MAX_BYTES, corpusComplete: items.length > 0 && complete === items.length,
  };
  await saveJson(SUMMARY_PATH, summary);
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.corpusComplete) process.exitCode = 2;
}

main().catch((error) => { console.error(error); process.exit(1); });
