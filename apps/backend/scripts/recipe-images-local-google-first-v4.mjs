import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const ROOT = path.resolve(process.env.RECIPE_GOOGLE_LOCAL_ROOT || './data/mypa-recipe-media-local');
const CATALOG = path.resolve(process.env.RECIPE_GOOGLE_LOCAL_CATALOG || './data/mypa-recipe-media/recipe-catalog.jsonl');
const IMAGE_ROOT = path.join(ROOT, 'images', 'recipes');
const MANIFEST = path.join(ROOT, 'manifest', 'recipe-heroes-google-first.jsonl');
const FAILURE = path.join(ROOT, 'manifest', 'google-first-failures.jsonl');
const TARGET_BYTES = 150000;
const MIN_SIDE = 240;
const CONCURRENCY = Math.min(Math.max(Number(process.env.RECIPE_GOOGLE_LOCAL_CONCURRENCY || '1'), 1), 4);
const DELAY_MS = Math.max(Number(process.env.RECIPE_GOOGLE_LOCAL_DELAY_MS || '5000'), 0);
const SEARCH_TIMEOUT_MS = Math.max(Number(process.env.RECIPE_GOOGLE_LOCAL_SEARCH_TIMEOUT_MS || '15000'), 5000);
const IMAGE_TIMEOUT_MS = Math.max(Number(process.env.RECIPE_GOOGLE_LOCAL_IMAGE_TIMEOUT_MS || '20000'), 5000);
const LIMIT = Math.max(Number(process.env.RECIPE_GOOGLE_LOCAL_LIMIT || '0'), 0);
const FORCE = process.env.RECIPE_GOOGLE_LOCAL_FORCE === '1';
const UA = process.env.RECIPE_GOOGLE_LOCAL_USER_AGENT || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36';

const exists = (p) => { try { fsSync.accessSync(p); return true; } catch { return false; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; } };
const normalizeUrl = (value) => {
  if (!value) return null;
  let v = String(value).trim().replaceAll('\\/', '/').replaceAll('\\u003d', '=').replaceAll('\\u0026', '&');
  try { v = JSON.parse(`\"${v.replaceAll('\\"', '\\\"')}\"`); } catch {}
  try { v = decodeURIComponent(v); } catch {}
  if (v.startsWith('//')) v = `https:${v}`;
  return /^https?:\/\//i.test(v) ? v : null;
};
const rejectImageUrl = (u) => {
  if (!u) return true;
  const h = host(u);
  if (!h || ['facebook.com','instagram.com','pinterest.com','youtube.com','wikipedia.org'].some((x) => h === x || h.endsWith(`.${x}`))) return true;
  return /gstatic\.com\/images\/branding|googleusercontent\.com\/static|sprite|logo|icon|avatar|favicon|pixel|tracking|placeholder/i.test(u);
};
async function append(file, row) { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.appendFile(file, JSON.stringify(row) + '\n'); }
async function loadCatalog() {
  if (!exists(CATALOG)) throw new Error(`Catalog not found: ${CATALOG}`);
  return (await fs.readFile(CATALOG, 'utf8')).split(/\r?\n/).filter(Boolean).map(JSON.parse).map((r) => ({ recipeId: String(r.recipeId || r.id || ''), name: String(r.name || r.recipeName || '') })).filter((r) => r.recipeId && r.name);
}
async function requestText(url, timeout = SEARCH_TIMEOUT_MS, headers = {}) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), timeout);
  try {
    const r = await fetch(url, { redirect: 'follow', signal: c.signal, headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.8', ...headers } });
    const text = await r.text();
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return { text, url: r.url || url };
  } finally { clearTimeout(t); }
}
async function googleFirst(query) {
  const url = `https://www.google.com/search?tbm=isch&hl=en&gl=us&q=${encodeURIComponent(query)}`;
  const { text } = await requestText(url);
  const patterns = [
    /\"ou\"\s*:\s*\"((?:\\.|[^\"\\])+)\"/,
    /\\\"ou\\\"\s*:\s*\\\"((?:\\.|[^\"\\])+)\\\"/,
    /[?&]imgurl=([^&\"']+)/,
    /data-iurl=[\"']([^\"']+)[\"']/,
  ];
  for (const p of patterns) { const m = p.exec(text); const u = normalizeUrl(m?.[1]); if (u && !rejectImageUrl(u)) return { provider: 'google-images', imageUrl: u, position: 1, searchUrl: url }; }
  throw new Error('Google Images first result unavailable');
}
async function bingFirst(query) {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2`;
  const { text } = await requestText(url);
  const patterns = [
    /\"murl\"\s*:\s*\"((?:\\.|[^\"\\])+)\"/,
    /\"turl\"\s*:\s*\"((?:\\.|[^\"\\])+)\"/,
    /murl%22%3A%22([^%]+)%22/,
  ];
  for (const p of patterns) { const m = p.exec(text); const u = normalizeUrl(m?.[1]); if (u && !rejectImageUrl(u)) return { provider: 'bing-images', imageUrl: u, position: 1, searchUrl: url }; }
  throw new Error('Bing Images first result unavailable');
}
async function ddgFirst(query) {
  const pageUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`;
  const { text: page } = await requestText(pageUrl);
  const vqd = page.match(/vqd=['\"]([^'\"]+)['\"]/i)?.[1] || page.match(/vqd=([\d-]+)/i)?.[1];
  if (!vqd) throw new Error('DuckDuckGo image token unavailable');
  const apiUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json&l=us-en&vqd=${encodeURIComponent(vqd)}&f=,,,,,`;
  const { text: jsonText } = await requestText(apiUrl, SEARCH_TIMEOUT_MS, { Accept: 'application/json,text/plain,*/*' });
  const data = JSON.parse(jsonText);
  for (const item of Array.isArray(data.results) ? data.results : []) {
    const u = normalizeUrl(item.image);
    if (u && !rejectImageUrl(u)) return { provider: 'duckduckgo-images', imageUrl: u, position: 1, searchUrl: pageUrl };
  }
  throw new Error('DuckDuckGo Images first result unavailable');
}
async function findFirstImage(recipeName) {
  const query = `${recipeName} recipe`;
  const providers = [googleFirst, bingFirst, ddgFirst];
  let errors = [];
  for (const provider of providers) {
    try { return await provider(query); } catch (e) { errors.push(`${e instanceof Error ? e.message : String(e)}`); }
  }
  throw new Error(errors.join(' | '));
}
async function downloadImage(url) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), IMAGE_TIMEOUT_MS);
  try {
    const r = await fetch(url, { redirect: 'follow', signal: c.signal, headers: { 'User-Agent': UA, Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.7' } });
    if (!r.ok) throw new Error(`image ${r.status}`);
    const body = Buffer.from(await r.arrayBuffer()); if (!body.length) throw new Error('empty image');
    return body;
  } finally { clearTimeout(t); }
}
async function prepareImage(body) {
  const input = sharp(body, { failOn: 'none' }).rotate();
  const meta = await input.metadata();
  const sw = Number(meta.width || 0), sh = Number(meta.height || 0);
  if (Math.min(sw, sh) < MIN_SIDE) throw new Error(`source too small (${sw}x${sh})`);
  let best = null;
  for (const width of [1600, 1400, 1280, 1200, 1080, 960, 880, 800, 720, 640, 576, 512, 480, 384, 320, 240]) {
    for (const quality of [90, 82, 74, 66, 58, 50, 42, 34, 26, 18]) {
      const out = await input.clone().resize({ width, fit: 'inside', withoutEnlargement: true }).webp({ quality, effort: 5 }).toBuffer();
      const m = await sharp(out, { failOn: 'none' }).metadata();
      const item = { out, width: Number(m.width || width), height: Number(m.height || 0), bytes: out.byteLength };
      if (Math.min(item.width, item.height) < MIN_SIDE) continue;
      if (item.bytes <= TARGET_BYTES && (!best || item.bytes > best.bytes)) best = item;
    }
  }
  if (best) return best;
  throw new Error('unable to encode image below 150KB');
}
async function hasHero(id) { const d = path.join(IMAGE_ROOT, id); return exists(path.join(d, 'hero.webp')) || exists(path.join(d, '01.webp')); }
async function saveHero(recipe, found, prepared) {
  const dir = path.join(IMAGE_ROOT, recipe.recipeId); await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, 'hero.webp'); await fs.writeFile(file, prepared.out);
  await append(MANIFEST, { recipeId: recipe.recipeId, recipeName: recipe.name, imageType: 'hero', file: path.relative(ROOT, file), source: found.provider, sourceImageUrl: found.imageUrl, query: `${recipe.name} recipe`, searchUrl: found.searchUrl, resultPosition: 1, verified: false, confidence: 'unverified', width: prepared.width, height: prepared.height, bytes: prepared.bytes, sha256: crypto.createHash('sha256').update(prepared.out).digest('hex'), downloadedAt: new Date().toISOString() });
}
async function main() {
  const catalog = await loadCatalog();
  const candidates = [];
  for (const recipe of catalog) if (FORCE || !(await hasHero(recipe.recipeId))) candidates.push(recipe);
  const selected = LIMIT ? candidates.slice(0, LIMIT) : candidates;
  const stats = { totalCatalog: catalog.length, selected: selected.length, complete: 0, failed: 0, skipped: catalog.length - candidates.length };
  console.log(JSON.stringify({ engine: 'local-image-first-v4', policy: 'Google first, Bing fallback, DuckDuckGo fallback; one hero per recipe', localOnly: true, targetBytes: TARGET_BYTES, concurrency: CONCURRENCY, delayMs: DELAY_MS, ...stats }, null, 2));
  let cursor = 0;
  async function worker() {
    while (true) {
      const i = cursor++; if (i >= selected.length) return;
      const recipe = selected[i];
      try {
        const found = await findFirstImage(recipe.name); const body = await downloadImage(found.imageUrl); const prepared = await prepareImage(body); await saveHero(recipe, found, prepared);
        stats.complete += 1; console.log(`[COMPLETE ${stats.complete}] ${recipe.name} -> 1 hero [${found.provider}] ${prepared.bytes} bytes`);
      } catch (e) {
        stats.failed += 1; const reason = e instanceof Error ? e.message : String(e); await append(FAILURE, { recipeId: recipe.recipeId, recipeName: recipe.name, status: 'pending-retry', reason, updatedAt: new Date().toISOString() }); console.error(`[PENDING ${stats.failed}] ${recipe.name}: ${reason}`);
      }
      if (DELAY_MS) await sleep(DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, selected.length) }, worker));
  const missing = catalog.length - stats.skipped - stats.complete;
  console.log(JSON.stringify({ status: missing ? 'partial' : 'complete', ...stats, missingAfterRun: missing }, null, 2));
  process.exitCode = missing ? 2 : 0;
}
main().catch((e) => { console.error(e); process.exit(1); });
