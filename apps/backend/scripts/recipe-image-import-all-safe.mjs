import sharp from 'sharp';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'recipe-images';
const MAX_BYTES = 60 * 1024;
const BATCH_SIZE = Math.min(Math.max(Number(process.env.RECIPE_IMAGE_BATCH_SIZE || '100'), 1), 500);
const MAX_PASSES = Math.max(Number(process.env.RECIPE_IMAGE_MAX_PASSES || '200'), 1);
const WIKIMEDIA_DELAY_MS = Math.max(Number(process.env.WIKIMEDIA_DELAY_MS || '1500'), 1000);
const WIKIMEDIA_API = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT = 'MyPersonalAssistant/1.0 (https://github.com/Ramin-rezaie-nazari/my-personal-assistant)';

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
const authHeaders = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const normalize = (v = '') => String(v).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
const htmlToText = (v = '') => String(v).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, ' ').trim();

function license(meta = {}) {
  const terms = `${htmlToText(meta.LicenseShortName?.value || meta.LicenseShortName || '')} ${htmlToText(meta.UsageTerms?.value || meta.UsageTerms || '')}`;
  if (/non[- ]?commercial|\bNC\b|no derivatives|\bND\b/i.test(terms)) return null;
  const url = htmlToText(meta.LicenseUrl?.value || meta.LicenseUrl || '');
  if (/CC0|public domain|public-domain/i.test(terms)) return { name: 'CC0 / Public Domain', url };
  if (/CC BY-SA/i.test(terms)) return { name: 'CC BY-SA', url };
  if (/CC BY/i.test(terms)) return { name: 'CC BY', url };
  return null;
}

function safeCandidate(recipeName, title, description) {
  const recipe = normalize(recipeName);
  const titleNorm = normalize(title);
  const descNorm = normalize(description);
  if (!recipe) return false;
  const exactTitle = titleNorm.includes(recipe);
  const exactDescription = descNorm.includes(recipe);
  if (!exactTitle && !exactDescription) return false;
  if (/(logo|icon|map|diagram|flag|screenshot|poster|cover|symbol|interior|building|street)/i.test(title)) return false;
  return true;
}

async function fetchJson(url, attempts = 6) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      const body = await r.text();
      if (r.ok) return body ? JSON.parse(body) : null;
      if (r.status === 429 || r.status === 503) {
        const retry = Number(r.headers.get('retry-after') || '0');
        await sleep(retry > 0 ? retry * 1000 : Math.max(5000, 3000 * 2 ** i));
        continue;
      }
      throw new Error(`${r.status} ${body}`);
    } catch (e) { last = e; await sleep(1500 * 2 ** i); }
  }
  throw last;
}

async function rest(path, options = {}, attempts = 5) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { ...authHeaders, 'Content-Type': 'application/json', ...(options.headers || {}) } });
      const body = await r.text();
      if (r.ok) return body ? JSON.parse(body) : null;
      if (r.status === 429 || r.status >= 500) { await sleep(1000 * 2 ** i); continue; }
      throw new Error(`${r.status} ${path}: ${body}`);
    } catch (e) { last = e; await sleep(1000 * 2 ** i); }
  }
  throw last;
}

async function ensureBucket() {
  const r = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, { method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, file_size_limit: MAX_BYTES, allowed_mime_types: ['image/webp'] }) });
  if (r.ok) return;
  const text = await r.text(); let p = null; try { p = JSON.parse(text); } catch {}
  if (r.status === 409 || p?.code === 'BucketAlreadyExists' || p?.statusCode === '409') return;
  throw new Error(`Bucket error ${r.status}: ${text}`);
}

async function allIds(path, column, filter) {
  const out = new Set(); let offset = 0;
  while (true) {
    const rows = await rest(`${path}?select=${column}&${filter}&limit=1000&offset=${offset}`);
    for (const row of rows || []) out.add(row[column]);
    if (!rows || rows.length < 1000) break;
    offset += rows.length;
  }
  return out;
}

async function nextBatch(existing, skipped) {
  const out = []; let offset = 0;
  while (out.length < BATCH_SIZE) {
    const page = await rest(`recipes?select=id,name&order=created_at.asc,id.asc&limit=1000&offset=${offset}`);
    if (!page?.length) break;
    for (const r of page) {
      if (!existing.has(r.id) && !skipped.has(r.id)) { out.push(r); if (out.length >= BATCH_SIZE) break; }
    }
    if (page.length < 1000) break;
    offset += page.length;
  }
  return out;
}

async function attempt(recipeId, status, reason) {
  await rest('recipe_image_import_attempts', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ recipe_id: recipeId, status, reason, attempt_count: 1, updated_at: new Date().toISOString() }) });
}

async function search(recipeName) {
  const q = new URLSearchParams({ action: 'query', generator: 'search', gsrsearch: `"${recipeName}"`, gsrnamespace: '6', gsrlimit: '10', prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '900', format: 'json', formatversion: '2' });
  await sleep(WIKIMEDIA_DELAY_MS);
  const data = await fetchJson(`${WIKIMEDIA_API}?${q.toString()}`);
  for (const page of data?.query?.pages || []) {
    const info = page.imageinfo?.[0]; if (!info?.thumburl && !info?.url) continue;
    const meta = info.extmetadata || {}; const lic = license(meta); if (!lic) continue;
    const title = page.title || ''; const desc = htmlToText(meta.ImageDescription?.value || meta.ObjectName?.value || '');
    if (!safeCandidate(recipeName, title, desc)) continue;
    return { title, description: desc, author: htmlToText(meta.Artist?.value || meta.Credit?.value || 'Wikimedia Commons contributor'), license: lic, imageUrl: info.thumburl || info.url, sourceUrl: page.fullurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}` };
  }
  return null;
}

async function compress(buf) {
  for (const width of [900, 800, 720, 640, 576, 512, 448, 384, 320]) {
    for (const quality of [74, 68, 62, 56, 50, 44, 38, 32]) {
      const out = await sharp(buf).rotate().resize({ width, height: width, fit: 'inside', withoutEnlargement: true }).webp({ quality, effort: 6 }).toBuffer();
      if (out.byteLength <= MAX_BYTES) { const m = await sharp(out).metadata(); return { out, width: m.width ?? width, height: m.height ?? width }; }
    }
  }
  throw new Error('Could not produce a WebP <= 60KB');
}

async function upload(key, buf) {
  const p = key.split('/').map(encodeURIComponent).join('/');
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${p}`, { method: 'POST', headers: { ...authHeaders, 'Content-Type': 'image/webp', 'Cache-Control': '31536000', 'x-upsert': 'true' }, body: buf });
  const text = await r.text(); if (!r.ok) throw new Error(`Storage ${r.status}: ${text}`);
}
async function remove(key) { const p = key.split('/').map(encodeURIComponent).join('/'); await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${p}`, { method: 'DELETE', headers: authHeaders }); }

async function processRecipe(recipe) {
  const c = await search(recipe.name);
  if (!c) { await attempt(recipe.id, 'skipped', 'no sufficiently relevant exact licensed Commons image'); return 'skipped'; }
  const r = await fetch(c.imageUrl, { headers: { 'User-Agent': USER_AGENT } }); if (!r.ok) throw new Error(`Image download ${r.status}`);
  const compressed = await compress(Buffer.from(await r.arrayBuffer()));
  const key = `recipes/${recipe.id}/hero.webp`;
  const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`;
  await upload(key, compressed.out);
  try {
    await rest('recipe_images', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ recipe_id: recipe.id, image_type: 'hero', step_number: null, image_url: url, width: compressed.width, height: compressed.height, byte_size: compressed.out.byteLength, mime_type: 'image/webp', alt_text: recipe.name, sort_order: 0, storage_key: key, source_name: 'Wikimedia Commons', source_url: c.sourceUrl, source_license: c.license.name, source_attribution: `${c.author}; Wikimedia Commons; ${c.license.name}${c.license.url ? ` ${c.license.url}` : ''} Modified: resized and recompressed to WebP <= 60KB.` }) });
  } catch (e) { await remove(key); throw e; }
  return 'imported';
}

async function main() {
  await ensureBucket();
  const existing = await allIds('recipe_images', 'recipe_id', 'image_type=eq.hero');
  const skipped = await allIds('recipe_image_import_attempts', 'recipe_id', 'status=eq.skipped');
  let imported = 0, skippedCount = 0, failed = 0;
  for (let pass = 1; pass <= MAX_PASSES; pass += 1) {
    const batch = await nextBatch(existing, skipped); if (!batch.length) break;
    let progress = 0;
    for (const recipe of batch) {
      try {
        const status = await processRecipe(recipe);
        if (status === 'imported') { existing.add(recipe.id); imported += 1; progress += 1; }
        else { skipped.add(recipe.id); skippedCount += 1; progress += 1; }
      } catch (e) { failed += 1; await attempt(recipe.id, 'failed', e instanceof Error ? e.message : String(e)); console.error(`[FAILED] ${recipe.id} ${recipe.name}: ${e instanceof Error ? e.message : e}`); }
    }
    console.log(JSON.stringify({ pass, batch: batch.length, imported, skipped: skippedCount, failed }, null, 2));
    if (progress === 0) throw new Error('No progress in this pass. Stopping safely; rerun after reviewing failures.');
  }
  console.log(JSON.stringify({ status: 'complete', imported, skipped: skippedCount, failed }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
