import sharp from 'sharp';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE = Math.min(Math.max(Number(process.env.RECIPE_IMAGE_BATCH_SIZE || '100'), 1), 250);
const CONCURRENCY = Math.min(Math.max(Number(process.env.RECIPE_IMAGE_CONCURRENCY || '3'), 1), 6);
const MAX_BYTES = 60 * 1024;
const BUCKET = 'recipe-images';
const GOOGLE_DELAY_MS = Math.max(Number(process.env.RECIPE_IMAGE_GOOGLE_DELAY_MS || '1200'), 800);
const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36 MyPersonalAssistant/1.0';
const GOOGLE = 'https://www.google.com/search';
const BING = 'https://www.bing.com/images/search';
const WIKIMEDIA = 'https://commons.wikimedia.org/w/api.php';

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
const authHeaders = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const decode = (s) => String(s).replace(/\\u003d/g, '=').replace(/\\u0026/g, '&').replace(/\\u002f/gi, '/').replace(/\\\//g, '/').replace(/&amp;/g, '&').replace(/\\x26/g, '&');
const normalize = (v = '') => String(v).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
const tokens = (v) => [...new Set(normalize(v).split(' ').filter((x) => x.length >= 3))];
const imageExt = /\.(?:jpe?g|png|webp|avif)(?:[?#&].*)?$/i;

async function fetchText(url, attempts = 5) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8' } });
      const text = await r.text();
      if (r.ok) return text;
      if (![429, 500, 502, 503, 504].includes(r.status)) throw new Error(`${r.status}: ${text.slice(0, 300)}`);
      await sleep(Math.max(1500, 1500 * 2 ** i));
    } catch (e) { last = e; if (i < attempts - 1) await sleep(1000 * 2 ** i); }
  }
  throw last;
}

async function rest(path, options = {}, attempts = 5) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { ...authHeaders, 'Content-Type': 'application/json', ...(options.headers || {}) } });
      const text = await r.text();
      if (r.ok) return text ? JSON.parse(text) : null;
      if (![429, 500, 502, 503, 504].includes(r.status)) throw new Error(`${r.status} ${path}: ${text.slice(0, 500)}`);
      await sleep(1000 * 2 ** i);
    } catch (e) { last = e; if (i < attempts - 1) await sleep(1000 * 2 ** i); }
  }
  throw last;
}

function candidateScore(recipeName, title = '', url = '') {
  const rt = tokens(recipeName), hay = normalize(`${title} ${url}`);
  if (!rt.length) return 0;
  const overlap = rt.filter((t) => hay.includes(t)).length / rt.length;
  const bad = /(logo|icon|map|diagram|flag|screenshot|poster|cover|symbol|menu|restaurant[- ]?interior)/i.test(`${title} ${url}`) ? 0.35 : 0;
  const food = /(food|dish|recipe|cooked|baked|grilled|roasted|fried|stew|soup|salad|cake|pie|bread|pasta|rice|noodle|curry)/i.test(`${title} ${url}`) ? 0.15 : 0;
  return Math.max(0, overlap * 0.75 + food - bad);
}

function googleCandidates(recipeName, html) {
  const searchUrl = `${GOOGLE}?tbm=isch&tbs=sur%3Acl&q=${encodeURIComponent(`${recipeName} food`)}`;
  const normalized = decode(html);
  const urls = [];
  const seen = new Set();
  const push = (url, title = '') => {
    try {
      const u = decode(url);
      const host = new URL(u).hostname;
      if (!/^https?:\/\//i.test(u) || /google(?:usercontent|apis)?\.com|gstatic\.com|google\.com/i.test(host)) return;
      if (!imageExt.test(u) && !/[?&](?:w|width|size)=/i.test(u)) return;
      if (seen.has(u)) return;
      seen.add(u); urls.push({ imageUrl: u, sourceUrl: searchUrl, title, sourceName: 'Google Images' });
    } catch {}
  };
  for (const m of normalized.matchAll(/"(https?:\/\/[^"\\]+)"/g)) push(m[1]);
  for (const m of normalized.matchAll(/(?:https?:\\\/\\\/|https?:\/\/)([^"'<>\\ ]+)/g)) push(m[0].replace(/\\\//g, '/'));
  return urls.sort((a, b) => candidateScore(recipeName, b.title, b.imageUrl) - candidateScore(recipeName, a.title, a.imageUrl)).slice(0, 20);
}

function bingCandidates(recipeName, html) {
  const searchUrl = `${BING}?q=${encodeURIComponent(`${recipeName} food`)}`;
  const out = [], seen = new Set();
  for (const m of html.matchAll(/\{[^{}]{0,8000}"murl":"([^"]+)"[^{}]{0,8000}\}/g)) {
    const chunk = m[0];
    const imageUrl = decode(m[1]);
    if (!/^https?:\/\//i.test(imageUrl) || seen.has(imageUrl)) continue;
    const title = decode(chunk.match(/"t":"([^"]*)"/)?.[1] || '');
    const pageUrl = decode(chunk.match(/"purl":"([^"]*)"/)?.[1] || searchUrl);
    seen.add(imageUrl);
    out.push({ imageUrl, sourceUrl: pageUrl, title, sourceName: 'Bing Images' });
  }
  return out.slice(0, 20);
}

function commonsLicense(meta = {}) {
  const terms = String(meta.LicenseShortName?.value || meta.LicenseShortName || '') + ' ' + String(meta.UsageTerms?.value || meta.UsageTerms || '');
  if (/non[- ]?commercial|\bNC\b|no derivatives|\bND\b/i.test(terms)) return null;
  if (/CC0|public domain|public-domain/i.test(terms)) return { name: 'CC0 / Public Domain', url: String(meta.LicenseUrl?.value || meta.LicenseUrl || '') };
  if (/CC BY-SA/i.test(terms)) return { name: 'CC BY-SA', url: String(meta.LicenseUrl?.value || meta.LicenseUrl || '') };
  if (/CC BY/i.test(terms)) return { name: 'CC BY', url: String(meta.LicenseUrl?.value || meta.LicenseUrl || '') };
  return null;
}

async function commonsCandidates(recipeName) {
  const variants = [`"${recipeName}"`, `"${recipeName}" food`, recipeName];
  const out = [], seen = new Set();
  for (const term of variants) {
    const q = new URLSearchParams({ action: 'query', generator: 'search', gsrsearch: term, gsrnamespace: '6', gsrlimit: '30', prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '1200', format: 'json', formatversion: '2' });
    const data = JSON.parse(await fetchText(`${WIKIMEDIA}?${q}`));
    for (const page of data?.query?.pages || []) {
      const info = page.imageinfo?.[0]; if (!info?.thumburl && !info?.url) continue;
      const license = commonsLicense(info.extmetadata || {}); if (!license || seen.has(page.pageid)) continue;
      const title = page.title || ''; const description = String(info.extmetadata?.ImageDescription?.value || info.extmetadata?.ObjectName?.value || '').replace(/<[^>]+>/g, ' ');
      const score = candidateScore(recipeName, `${title} ${description}`, info.thumburl || info.url);
      if (score < 0.35) continue;
      seen.add(page.pageid);
      out.push({ imageUrl: info.thumburl || info.url, sourceUrl: page.fullurl || `${WIKIMEDIA}?${q}`, title, sourceName: 'Wikimedia Commons', license, score });
    }
    await sleep(500);
  }
  return out.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 20);
}

async function probeCandidates(candidates) {
  const usable = [];
  for (const c of candidates.slice(0, 8)) {
    try {
      const r = await fetch(c.imageUrl, { headers: { 'User-Agent': USER_AGENT, Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8' }, redirect: 'follow' });
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 4000) continue;
      const meta = await sharp(buf, { failOn: 'none' }).metadata();
      if (!meta.width || !meta.height || meta.width < 250 || meta.height < 180) continue;
      const ratio = meta.width / meta.height;
      if (ratio < 0.45 || ratio > 2.2) continue;
      usable.push({ ...c, originalBuffer: buf, originalWidth: meta.width, originalHeight: meta.height });
    } catch {}
  }
  return usable;
}

async function searchRecipe(recipeName) {
  const googleUrl = `${GOOGLE}?tbm=isch&tbs=sur%3Acl&q=${encodeURIComponent(`${recipeName} food`)}`;
  try {
    await sleep(GOOGLE_DELAY_MS);
    const html = await fetchText(googleUrl);
    const usable = await probeCandidates(googleCandidates(recipeName, html));
    if (usable.length) return usable[0];
  } catch (e) { console.warn(`[google] ${recipeName}: ${e instanceof Error ? e.message : String(e)}`); }
  try {
    const html = await fetchText(`${BING}?q=${encodeURIComponent(`${recipeName} food`)}`);
    const usable = await probeCandidates(bingCandidates(recipeName, html));
    if (usable.length) return usable[0];
  } catch (e) { console.warn(`[bing] ${recipeName}: ${e instanceof Error ? e.message : String(e)}`); }
  return (await probeCandidates(await commonsCandidates(recipeName)))[0] || null;
}

async function compress(input) {
  for (const width of [960, 800, 720, 640, 576, 512, 448, 384, 320]) {
    for (const quality of [74, 68, 62, 56, 50, 44, 38, 32]) {
      const out = await sharp(input, { failOn: 'none' }).rotate().resize({ width, height: width, fit: 'inside', withoutEnlargement: true }).webp({ quality, effort: 6 }).toBuffer();
      if (out.byteLength <= MAX_BYTES) { const m = await sharp(out).metadata(); return { out, width: m.width, height: m.height }; }
    }
  }
  throw new Error('Unable to produce WebP <= 60KB');
}

async function upload(key, buf) {
  const encoded = key.split('/').map(encodeURIComponent).join('/');
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encoded}`, { method: 'POST', headers: { ...authHeaders, 'Content-Type': 'image/webp', 'Cache-Control': '31536000', 'x-upsert': 'true' }, body: buf });
  if (!r.ok) throw new Error(`Storage ${r.status}: ${await r.text()}`);
}
async function remove(key) { const encoded = key.split('/').map(encodeURIComponent).join('/'); await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encoded}`, { method: 'DELETE', headers: authHeaders }); }
async function recordAttempt(recipeId, status, reason, count = 1) { await rest('recipe_image_import_attempts', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ recipe_id: recipeId, status, reason, attempt_count: count, updated_at: new Date().toISOString() }) }); }

async function processRecipe(recipe) {
  const candidate = await searchRecipe(recipe.name);
  if (!candidate) { await recordAttempt(recipe.id, 'skipped', 'Google Images, Bing Images and Wikimedia Commons produced no usable candidate'); return 'skipped'; }
  const compressed = await compress(candidate.originalBuffer);
  const key = `recipes/${recipe.id}/hero.webp`;
  const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`;
  await upload(key, compressed.out);
  try {
    await rest('recipe_images', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ recipe_id: recipe.id, image_type: 'hero', step_number: null, image_url: url, width: compressed.width, height: compressed.height, byte_size: compressed.out.byteLength, mime_type: 'image/webp', alt_text: recipe.name, sort_order: 0, storage_key: key, source_name: candidate.sourceName, source_url: candidate.sourceUrl || candidate.imageUrl, source_license: candidate.license?.name || 'Search result; license not independently verified', source_attribution: candidate.license ? `${candidate.title || recipe.name}; ${candidate.sourceName}; ${candidate.license.name}${candidate.license.url ? ` ${candidate.license.url}` : ''}. Modified: resized and recompressed to WebP <= 60KB.` : `${candidate.title || recipe.name}; ${candidate.sourceName}; search result selected as first usable image. Modified: resized and recompressed to WebP <= 60KB.` }) });
  } catch (e) { await remove(key); throw e; }
  return 'imported';
}

async function getBatch() {
  const out = [];
  for (let offset = 0; out.length < BATCH_SIZE; offset += 1000) {
    const recipes = await rest(`recipes?select=id,name&order=created_at.asc,id.asc&limit=1000&offset=${offset}`);
    if (!recipes?.length) break;
    const ids = recipes.map((r) => r.id).filter(Boolean);
    const heroRows = ids.length ? await rest(`recipe_images?select=recipe_id&image_type=eq.hero&recipe_id=in.(${ids.join(',')})&limit=1000`) : [];
    const existing = new Set((heroRows || []).map((r) => r.recipe_id));
    for (const recipe of recipes) { if (!existing.has(recipe.id)) out.push(recipe); if (out.length >= BATCH_SIZE) break; }
    if (recipes.length < 1000) break;
  }
  return out;
}

async function mapConcurrent(items, limit, worker) {
  const results = new Array(items.length); let cursor = 0;
  async function runner() { while (true) { const i = cursor++; if (i >= items.length) return; try { results[i] = await worker(items[i]); } catch (e) { results[i] = { status: 'failed', error: e instanceof Error ? e.message : String(e) }; } } }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runner)); return results;
}

async function main() {
  const recipes = await getBatch();
  if (!recipes.length) { console.log(JSON.stringify({ status: 'complete', message: 'No unresolved recipes in first batch.' })); return; }
  const results = await mapConcurrent(recipes, CONCURRENCY, async (r) => ({ recipeId: r.id, name: r.name, status: await processRecipe(r) }));
  const imported = results.filter((r) => r?.status === 'imported').length;
  const skipped = results.filter((r) => r?.status === 'skipped').length;
  const failed = results.filter((r) => r?.status === 'failed').length;
  console.log(JSON.stringify({ status: 'batch-complete', requested: recipes.length, imported, skipped, failed, results }, null, 2));
  if (failed && !imported) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
