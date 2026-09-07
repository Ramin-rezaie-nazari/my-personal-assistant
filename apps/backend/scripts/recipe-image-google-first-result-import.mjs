import sharp from 'sharp';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'recipe-images';
const MAX_BYTES = 60 * 1024;
const CONCURRENCY = Math.min(Math.max(Number(process.env.RECIPE_GOOGLE_CONCURRENCY || '2'), 1), 3);
const DELAY_MS = Math.max(Number(process.env.RECIPE_GOOGLE_DELAY_MS || '2500'), 500);
const LIMIT = Math.max(Number(process.env.RECIPE_GOOGLE_LIMIT || '0'), 0);
const DRY_RUN = process.env.RECIPE_GOOGLE_DRY_RUN === '1';
const FORCE = process.env.RECIPE_GOOGLE_FORCE === '1';
const PAGE_SIZE = 1000;
const SEARCH_BASES = [
  'https://www.google.com/search?tbm=isch&hl=en&gl=us&q=',
  'https://www.google.com/search?udm=2&hl=en&gl=us&q=',
];

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const authHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function supabase(path, options = {}, attempts = 6) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        ...options,
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
      const text = await response.text();
      if (response.ok) return text ? JSON.parse(text) : null;
      if (response.status === 429 || response.status >= 500) {
        await sleep(Math.min(30_000, 1500 * 2 ** i));
        continue;
      }
      throw new Error(`${response.status} ${path}: ${text}`);
    } catch (error) {
      last = error;
      if (i < attempts - 1) await sleep(Math.min(30_000, 1500 * 2 ** i));
    }
  }
  throw last;
}

async function ensureBucket() {
  const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: BUCKET,
      name: BUCKET,
      public: true,
      file_size_limit: MAX_BYTES,
      allowed_mime_types: ['image/webp'],
    }),
  });
  if (response.ok || response.status === 409) return;
  throw new Error(`Bucket error ${response.status}: ${await response.text()}`);
}

async function deleteStorage(key) {
  const encoded = key.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encoded}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Storage delete failed: ${response.status} ${await response.text()}`);
  }
}

async function fetchAllRecipes() {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await supabase(
      `recipes?select=id,name&order=id.asc&limit=${PAGE_SIZE}&offset=${offset}`,
    );
    rows.push(...(page || []).filter((row) => row?.id && String(row?.name || '').trim()));
    if (!page || page.length < PAGE_SIZE) break;
  }
  return rows;
}

async function fetchHeroIds() {
  const ids = new Set();
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await supabase(
      `recipe_images?select=recipe_id&image_type=eq.hero&limit=${PAGE_SIZE}&offset=${offset}`,
    );
    for (const row of page || []) if (row?.recipe_id) ids.add(row.recipe_id);
    if (!page || page.length < PAGE_SIZE) break;
  }
  return ids;
}

function decodeGoogleString(value) {
  try {
    return JSON.parse(`"${value.replace(/"/g, '\\"')}"`);
  } catch {
    try {
      return JSON.parse(`"${value}"`);
    } catch {
      return value.replaceAll('\\/', '/').replaceAll('\\u0026', '&');
    }
  }
}

function normalizeUrl(url) {
  if (!url) return null;
  let value = String(url).trim();
  if (value.startsWith('//')) value = `https:${value}`;
  value = value.replaceAll('\\u003d', '=').replaceAll('\\u0026', '&').replaceAll('\\/', '/');
  if (!/^https?:\/\//i.test(value)) return null;
  return value;
}

function extractImageCandidates(html) {
  const candidates = [];

  const originalRegexes = [
    /"ou"\s*:\s*"((?:\\.|[^"\\])+)"/g,
    /\\"ou\\"\s*:\s*\\"((?:\\.|[^"\\])+)\\"/g,
    /[?&]imgurl=([^&"']+)/g,
    /data-iurl=["']([^"']+)["']/g,
    /data-original=["']([^"']+)["']/g,
  ];

  for (const regex of originalRegexes) {
    for (const match of html.matchAll(regex)) {
      const raw = match[1];
      let value = raw;
      try {
        value = decodeURIComponent(value);
      } catch {
        // Keep raw URL when it is not percent-encoded.
      }
      if (regex.source.includes('"ou"')) value = decodeGoogleString(value);
      const url = normalizeUrl(value);
      if (url) candidates.push(url);
    }
  }

  return [...new Set(candidates)].filter((url) => {
    const lower = url.toLowerCase();
    return !lower.includes('gstatic.com/images/branding') && !lower.includes('googleusercontent.com/static');
  });
}

async function googleFirstImage(recipeName) {
  const query = `${recipeName} recipe`;
  let last;
  for (const base of SEARCH_BASES) {
    const url = `${base}${encodeURIComponent(query)}`;
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: {
          'User-Agent': process.env.RECIPE_GOOGLE_USER_AGENT ||
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
      });
      const html = await response.text();
      if (!response.ok) {
        last = new Error(`Google search ${response.status}`);
        await sleep(1500);
        continue;
      }
      const candidates = extractImageCandidates(html);
      if (!candidates.length) {
        const blocked = /consent|unusual traffic|captcha|not a robot/i.test(html);
        last = new Error(blocked ? 'Google Images blocked/consent challenge' : 'No original image URL found');
        await sleep(1500);
        continue;
      }
      return { query, searchUrl: url, imageUrl: candidates[0], resultPosition: 1 };
    } catch (error) {
      last = error;
      await sleep(1500);
    }
  }
  throw last || new Error('Google Images search failed');
}

async function downloadImage(url) {
  let last;
  for (let i = 0; i < 4; i += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 MYPA recipe image importer',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.7',
        },
      });
      if (response.ok) {
        const body = Buffer.from(await response.arrayBuffer());
        if (!body.length) throw new Error('Downloaded image is empty');
        return body;
      }
      last = new Error(`Image download ${response.status}`);
      if (response.status < 500 && response.status !== 429) break;
    } catch (error) {
      last = error;
    }
    await sleep(Math.min(20_000, 1000 * 2 ** i));
  }
  throw last || new Error('Image download failed');
}

async function compress(input) {
  let best = null;
  for (const width of [960, 880, 800, 720, 640, 576, 512, 448, 384, 320]) {
    for (const quality of [76, 70, 64, 58, 52, 46, 40, 34, 28]) {
      const out = await sharp(input, { failOn: 'none' })
        .rotate()
        .resize({ width, fit: 'inside', withoutEnlargement: true })
        .webp({ quality, effort: 6 })
        .toBuffer();
      if (!best || out.byteLength < best.byteLength) best = out;
      if (out.byteLength <= MAX_BYTES) {
        const metadata = await sharp(out, { failOn: 'none' }).metadata();
        return { out, width: metadata.width ?? width, height: metadata.height ?? width };
      }
    }
  }
  throw new Error(`No WebP variant <= ${MAX_BYTES} bytes (smallest=${best?.byteLength ?? 'unknown'})`);
}

async function upload(key, body) {
  const encoded = key.split('/').map(encodeURIComponent).join('/');
  let last;
  for (let i = 0; i < 6; i += 1) {
    try {
      const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encoded}`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'image/webp',
          'Cache-Control': '31536000',
          'x-upsert': 'true',
        },
        body,
      });
      const text = await response.text();
      if (response.ok) return;
      last = new Error(`Storage upload ${response.status}: ${text}`);
      if (response.status !== 429 && response.status < 500) break;
    } catch (error) {
      last = error;
    }
    await sleep(Math.min(30_000, 2500 * 2 ** i));
  }
  throw last || new Error('Storage upload failed');
}

async function recordAttempt(recipeId, status, reason) {
  await supabase('recipe_image_import_attempts', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      recipe_id: recipeId,
      status,
      reason,
      attempt_count: 1,
      updated_at: new Date().toISOString(),
    }),
  });
}

async function importOne(recipe, found) {
  const input = await downloadImage(found.imageUrl);
  const compressed = await compress(input);
  const key = `recipes/${recipe.id}/hero.webp`;
  const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`;

  if (!DRY_RUN) {
    await upload(key, compressed.out);
    try {
      await supabase('recipe_images', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({
          recipe_id: recipe.id,
          image_type: 'hero',
          step_number: null,
          image_url: imageUrl,
          width: compressed.width,
          height: compressed.height,
          byte_size: compressed.out.byteLength,
          mime_type: 'image/webp',
          alt_text: `${recipe.name} hero image`,
          sort_order: 0,
          storage_key: key,
          source_name: 'Google Images — first result',
          source_url: found.imageUrl,
          source_license: null,
          source_attribution: `Google Images first-result import; query="${found.query}"; result_position=1; search_url=${found.searchUrl}; downloaded=${new Date().toISOString()}; resized/recompressed to WebP <= 60KB.`,
        }),
      });
    } catch (error) {
      await deleteStorage(key);
      throw error;
    }
  }

  return {
    recipeId: recipe.id,
    recipeName: recipe.name,
    query: found.query,
    resultPosition: found.resultPosition,
    imageUrl: found.imageUrl,
    bytes: compressed.out.byteLength,
    width: compressed.width,
    height: compressed.height,
    dryRun: DRY_RUN,
  };
}

async function main() {
  await ensureBucket();
  const [recipes, existing] = await Promise.all([fetchAllRecipes(), fetchHeroIds()]);
  const work = recipes.filter((recipe) => FORCE || !existing.has(recipe.id));
  const selected = LIMIT > 0 ? work.slice(0, LIMIT) : work;
  const stats = { totalRecipes: recipes.length, alreadyHaveHero: recipes.length - work.length, selected: selected.length, imported: 0, failed: 0 };
  console.log(JSON.stringify({ ...stats, dryRun: DRY_RUN, force: FORCE, concurrency: CONCURRENCY, delayMs: DELAY_MS }, null, 2));

  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= selected.length) return;
      const recipe = selected[index];
      try {
        const found = await googleFirstImage(recipe.name);
        const result = await importOne(recipe, found);
        stats.imported += 1;
        console.log(JSON.stringify({ progress: stats.imported + stats.failed, ...result }, null, 2));
      } catch (error) {
        stats.failed += 1;
        const reason = error instanceof Error ? error.message : String(error);
        await recordAttempt(recipe.id, 'failed', `google_first_result: ${reason}`);
        console.error(`[FAILED] ${recipe.id} ${recipe.name}: ${reason}`);
      }
      await sleep(DELAY_MS);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, selected.length) }, () => worker()));
  const status = stats.failed ? 'incomplete' : 'complete';
  console.log(JSON.stringify({ status, ...stats }, null, 2));
  if (stats.failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
