import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const ROOT = path.resolve(process.env.RECIPE_IMAGE_QUALITY_ROOT || './data/mypa-recipe-media-quality');
const MANIFEST = path.join(ROOT, 'manifests', 'hero-quality-manifest.jsonl');
const LOG = path.join(ROOT, 'logs', 'failures.jsonl');
const BUCKET = 'recipe-images';
const SUPABASE_URL = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const PAGE_SIZE = 500;
const CONCURRENCY = Math.min(Math.max(Number(process.env.RECIPE_IMAGE_QUALITY_CONCURRENCY || '3'), 1), 5);
const DELAY_MS = Math.max(Number(process.env.RECIPE_IMAGE_QUALITY_DELAY_MS || '500'), 100);
const LIMIT = Math.max(Number(process.env.RECIPE_IMAGE_QUALITY_LIMIT || '0'), 0);
const START = Math.max(Number(process.env.RECIPE_IMAGE_QUALITY_START || '0'), 0);
const FORCE = process.env.RECIPE_IMAGE_QUALITY_FORCE === '1';
const MIN_SOURCE_SIDE = 640;
const MIN_OUTPUT_SIDE = 640;
const MAX_SOURCE_RATIO = 2.5;
const MAX_BYTES = 150 * 1024;
const ABSOLUTE_MAX_BYTES = 180 * 1024;
const PAGE_TIMEOUT = 25000;
const IMAGE_TIMEOUT = 25000;
const USER_AGENT = 'MYPA-recipe-image-quality/2.0';

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, Accept: 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString();

async function ensureDirs() {
  await Promise.all([fs.mkdir(path.dirname(MANIFEST), { recursive: true }), fs.mkdir(path.dirname(LOG), { recursive: true })]);
}

async function rest(pathname, options = {}, attempts = 5) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, { ...options, headers: { ...headers, 'Content-Type': 'application/json', ...(options.headers || {}) } });
      const text = await r.text();
      if (r.ok) return text ? JSON.parse(text) : null;
      last = new Error(`${r.status} ${pathname}: ${text}`);
      if (r.status !== 429 && r.status < 500) break;
    } catch (e) { last = e; }
    await sleep(Math.min(15000, 700 * 2 ** i));
  }
  throw last || new Error(`Supabase request failed: ${pathname}`);
}

async function paged(resource) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await rest(`${resource}&limit=${PAGE_SIZE}&offset=${offset}`);
    rows.push(...(Array.isArray(page) ? page : []));
    if (!Array.isArray(page) || page.length < PAGE_SIZE) return rows;
  }
}

function slugify(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function pageCandidates(recipe, imageName) {
  const raw = String(imageName || '').trim();
  const values = [...new Set([raw.replace(/^[-_]+/, ''), raw, slugify(recipe.name)].filter(Boolean))];
  return values.map((s) => `https://www.epicurious.com/recipes/food/views/${encodeURIComponent(s)}`);
}

function normalizeUrl(value) {
  if (!value) return null;
  let u = String(value).trim().replaceAll('&amp;', '&').replaceAll('\\/', '/').replaceAll('\\u003d', '=').replaceAll('\\u0026', '&');
  if (u.startsWith('//')) u = `https:${u}`;
  return /^https?:\/\//i.test(u) ? u : null;
}

function extractImageCandidates(html) {
  const found = [];
  const add = (value, rank = 10) => {
    const u = normalizeUrl(value ? decodeURIComponentSafe(String(value)) : null);
    if (!u) return;
    const l = u.toLowerCase();
    if (!(l.includes('assets.epicurious.com') || /\.(?:jpe?g|png|webp)(?:[?#]|$)/i.test(u))) return;
    let score = rank;
    if (l.includes('assets.epicurious.com')) score -= 10;
    if (l.includes('/master/')) score -= 10;
    const w = l.match(/(?:w_|width=|[?&]w=)(\d{3,4})/);
    if (w) score -= Math.min(Number(w[1]) / 500, 8);
    found.push({ url: u, score });
  };
  for (const m of html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]+content=["']([^"']+)["'][^>]*>/gi)) add(m[1], -20);
  for (const m of html.matchAll(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]*>/gi)) add(m[1], -20);
  for (const m of html.matchAll(/srcset=["']([^"']+)["']/gi)) for (const item of m[1].split(',')) add(item.trim().split(/\s+/)[0], 2);
  for (const m of html.matchAll(/(?:src|data-src|data-original)=["']([^"']+)["']/gi)) add(m[1], 5);
  for (const m of html.matchAll(/https?:\\?\/\\?\/assets\.epicurious\.com\/[^"'<>\\s]+/gi)) add(m[0], 0);
  const seen = new Set();
  return found.sort((a, b) => a.score - b.score).filter((x) => { const k = x.url.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
}
function decodeURIComponentSafe(v) { try { return decodeURIComponent(v); } catch { return v; } }

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...options, signal: controller.signal }); } finally { clearTimeout(timer); }
}

async function fetchPage(url) {
  const r = await fetchWithTimeout(url, { redirect: 'follow', headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.9' } }, PAGE_TIMEOUT);
  const html = await r.text();
  if (!r.ok || html.length < 1000) throw new Error(`Epicurious page ${r.status}: ${url}`);
  return { html, finalUrl: r.url || url };
}

async function fetchImage(url) {
  const r = await fetchWithTimeout(url, { redirect: 'follow', headers: { 'User-Agent': USER_AGENT, Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8' } }, IMAGE_TIMEOUT);
  if (!r.ok) throw new Error(`Image ${r.status}: ${url}`);
  const body = Buffer.from(await r.arrayBuffer());
  if (body.length < 5000) throw new Error(`Image too small by bytes: ${body.length}`);
  return body;
}

async function validateSource(body) {
  const m = await sharp(body, { failOn: 'none' }).rotate().metadata();
  const width = Number(m.width || 0), height = Number(m.height || 0);
  if (Math.min(width, height) < MIN_SOURCE_SIDE) throw new Error(`Source resolution too small: ${width}x${height}`);
  const ratio = width / height;
  if (ratio < 1 / MAX_SOURCE_RATIO || ratio > MAX_SOURCE_RATIO) throw new Error(`Source aspect ratio rejected: ${ratio.toFixed(2)}`);
  return { width, height, format: m.format || 'unknown' };
}

async function resolveImage(recipe, imageName) {
  let last;
  const direct = pageCandidates(recipe, imageName);
  for (const pageUrl of direct) {
    try {
      const page = await fetchPage(pageUrl);
      const candidates = extractImageCandidates(page.html).slice(0, 24);
      let lastCandidate;
      for (const candidate of candidates) {
        try {
          const body = await fetchImage(candidate.url);
          const meta = await validateSource(body);
          return { body, pageUrl: page.finalUrl, imageUrl: candidate.url, sourceWidth: meta.width, sourceHeight: meta.height };
        } catch (e) { lastCandidate = e; }
      }
      last = lastCandidate || new Error(`No usable image on ${pageUrl}`);
    } catch (e) { last = e; }
  }

  const searchQueries = [
    `https://www.google.com/search?hl=en&gl=us&q=${encodeURIComponent(`site:epicurious.com/recipes/food/views ${recipe.name}`)}`,
    `https://www.bing.com/search?q=${encodeURIComponent(`site:epicurious.com/recipes/food/views ${recipe.name}`)}`,
  ];
  const discovered = [];
  for (const searchUrl of searchQueries) {
    try {
      const r = await fetchWithTimeout(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/140 Safari/537.36', Accept: 'text/html,application/xhtml+xml,*/*;q=0.8' } }, PAGE_TIMEOUT);
      const html = await r.text();
      if (!r.ok) continue;
      for (const m of html.matchAll(/https?:\/\/www\.epicurious\.com\/recipes\/food\/views\/[A-Za-z0-9_%\-]+/gi)) discovered.push(m[0].replace(/[.,)]+$/, ''));
    } catch {}
    if (discovered.length) break;
  }
  for (const pageUrl of [...new Set(discovered)].slice(0, 5)) {
    try {
      const page = await fetchPage(pageUrl);
      for (const candidate of extractImageCandidates(page.html).slice(0, 24)) {
        try {
          const body = await fetchImage(candidate.url);
          const meta = await validateSource(body);
          return { body, pageUrl: page.finalUrl, imageUrl: candidate.url, sourceWidth: meta.width, sourceHeight: meta.height };
        } catch (e) { last = e; }
      }
    } catch (e) { last = e; }
  }
  throw last || new Error(`Epicurious image unavailable for ${recipe.name}`);
}

async function encodeWebp(input) {
  for (const width of [1200, 1080, 960, 880, 800, 720, 640]) {
    for (const quality of [92, 88, 85, 82, 79, 76, 73, 70, 67]) {
      const output = await sharp(input, { failOn: 'none' }).rotate().resize({ width, fit: 'inside', withoutEnlargement: true }).webp({ quality, effort: 6 }).toBuffer();
      const m = await sharp(output, { failOn: 'none' }).metadata();
      const result = { output, width: Number(m.width || width), height: Number(m.height || width), bytes: output.length, quality };
      if (result.bytes <= MAX_BYTES && result.width >= MIN_OUTPUT_SIDE && result.height >= MIN_OUTPUT_SIDE / MAX_SOURCE_RATIO) return result;
      if (result.width >= MIN_OUTPUT_SIDE && result.bytes > MAX_BYTES && width === 640 && quality === 67 && result.bytes <= ABSOLUTE_MAX_BYTES) return result;
    }
  }
  throw new Error('Could not create acceptable WebP within 180KB');
}

async function upload(key, body) {
  const encoded = key.split('/').map(encodeURIComponent).join('/');
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      const r = await fetchWithTimeout(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encoded}`, { method: 'POST', headers: { ...headers, 'Content-Type': 'image/webp', 'Cache-Control': '31536000, immutable', 'x-upsert': 'true' }, body }, IMAGE_TIMEOUT);
      const text = await r.text();
      if (r.ok) return;
      if (r.status !== 429 && r.status < 500) throw new Error(`Storage ${r.status}: ${text}`);
    } catch (e) { if (attempt === 5) throw e; }
    await sleep(Math.min(15000, 1200 * 2 ** attempt));
  }
  throw new Error(`Storage upload failed: ${key}`);
}

async function upsertImage(recipe, packed, source) {
  const key = `recipes/${recipe.id}/hero.webp`;
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`;
  await upload(key, packed.output);
  try {
    await rest('recipe_images', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ recipe_id: recipe.id, image_type: 'hero', step_number: null, image_url: publicUrl, width: packed.width, height: packed.height, byte_size: packed.bytes, mime_type: 'image/webp', alt_text: recipe.name, sort_order: 0, storage_key: key, source_name: 'Epicurious recipe page', source_url: source.pageUrl, source_license: 'Source page; verify production rights per source policy', source_attribution: `Matched recipe image via image_name/title; image=${source.imageUrl}; original=${source.sourceWidth}x${source.sourceHeight}; final-dish hero; WebP quality=${packed.quality}; target <=150KB.` }) });
  } catch (e) {
    try { await fetchWithTimeout(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`, { method: 'DELETE', headers }, IMAGE_TIMEOUT); } catch {}
    throw e;
  }
}

function needsUpgrade(hero) {
  return !hero || Number(hero.width || 0) < 640 || Number(hero.height || 0) < 480 || Number(hero.byte_size || 0) < 30000;
}

async function append(file, row) { await fs.appendFile(file, `${JSON.stringify(row)}\n`); }

async function main() {
  await ensureDirs();
  const [recipes, sources, heroes] = await Promise.all([
    paged('recipes?select=id,name&order=id.asc'),
    paged('recipe_source_raw?select=recipe_id,image_name&order=recipe_id.asc'),
    paged('recipe_images?select=recipe_id,image_type,width,height,byte_size&image_type=eq.hero&order=recipe_id.asc'),
  ]);
  const sourceByRecipe = new Map();
  for (const row of sources) {
    const id = String(row?.recipe_id || '');
    const imageName = String(row?.image_name || '').trim();
    if (id && imageName && imageName !== '#NAME?' && !sourceByRecipe.has(id)) sourceByRecipe.set(id, imageName);
  }
  const heroByRecipe = new Map();
  for (const row of heroes) if (!heroByRecipe.has(String(row.recipe_id))) heroByRecipe.set(String(row.recipe_id), row);

  const eligible = recipes.filter((recipe) => FORCE || needsUpgrade(heroByRecipe.get(String(recipe.id))));
  const work = eligible.slice(START, LIMIT > 0 ? START + LIMIT : undefined);
  const stats = { startedAt: now(), totalRecipes: recipes.length, existingHeroes: heroes.length, sourceMappedRecipes: sourceByRecipe.size, sourceUnmappedRecipes: recipes.length - sourceByRecipe.size, weakOrMissingHeroes: eligible.length, selected: work.length, completed: 0, failed: 0, skipped: recipes.length - eligible.length, concurrency: CONCURRENCY, delayMs: DELAY_MS, targetMaxBytes: MAX_BYTES };
  console.log(JSON.stringify(stats, null, 2));

  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= work.length) return;
      const recipe = work[index];
      try {
        const imageName = sourceByRecipe.get(String(recipe.id)) || '';
        const source = await resolveImage(recipe, imageName);
        const packed = await encodeWebp(source.body);
        await upsertImage(recipe, packed, source);
        await append(MANIFEST, { recipeId: recipe.id, recipeName: recipe.name, status: 'upgraded', sourceType: 'epicurious-page', sourcePageUrl: source.pageUrl, sourceImageUrl: source.imageUrl, imageName: imageName || null, sourceWidth: source.sourceWidth, sourceHeight: source.sourceHeight, width: packed.width, height: packed.height, bytes: packed.bytes, quality: packed.quality, sha256: crypto.createHash('sha256').update(packed.output).digest('hex'), completedAt: now() });
        stats.completed += 1;
        console.log(`[UPGRADED] ${recipe.id} ${recipe.name} ${source.sourceWidth}x${source.sourceHeight} -> ${packed.width}x${packed.height} ${packed.bytes}B`);
      } catch (error) {
        const row = { recipeId: recipe.id, recipeName: recipe.name, imageName: sourceByRecipe.get(String(recipe.id)) || null, status: 'failed', reason: error instanceof Error ? error.message : String(error), failedAt: now() };
        await append(MANIFEST, row);
        await append(LOG, row);
        stats.failed += 1;
        console.error(`[FAILED] ${recipe.id} ${recipe.name}: ${row.reason}`);
      }
      await sleep(DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, work.length) }, () => worker()));
  stats.finishedAt = now();
  stats.status = stats.failed === 0 ? 'complete' : 'incomplete';
  await fs.writeFile(path.join(path.dirname(MANIFEST), 'summary.json'), JSON.stringify(stats, null, 2));
  console.log(JSON.stringify(stats, null, 2));
  if (stats.failed > 0) process.exitCode = 1;
}

main().catch(async (error) => {
  console.error(error);
  await ensureDirs().catch(() => {});
  await append(LOG, { status: 'fatal', reason: error instanceof Error ? error.message : String(error), failedAt: now() }).catch(() => {});
  process.exit(1);
});
