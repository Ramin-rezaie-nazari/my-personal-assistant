import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

/**
 * MYPA Local-first recipe hero mirror/importer.
 *
 * IMPORTANT:
 * - This script never writes to Supabase.
 * - Supabase is used only as a read source for the current recipe catalog
 *   and existing hero relations/storage URLs.
 * - All resulting recipe hero files, manifests and logs live on the Mac.
 * - Missing heroes are searched recipe-by-recipe through Google Images.
 * - The first downloaded candidate that passes image validation is used.
 */

const ROOT = path.resolve(process.env.RECIPE_LOCAL_ROOT || './data/mypa-recipe-media');
const IMAGE_ROOT = path.join(ROOT, 'images');
const MANIFEST_DIR = path.join(ROOT, 'manifests');
const LOG_DIR = path.join(ROOT, 'logs');
const CATALOG_PATH = path.join(ROOT, 'recipe-catalog.jsonl');
const MANIFEST_PATH = path.join(MANIFEST_DIR, 'recipe-hero-manifest.jsonl');
const SUMMARY_PATH = path.join(MANIFEST_DIR, 'summary.json');

const SUPABASE_URL = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '');
const SUPABASE_PUBLIC_URL = (process.env.SUPABASE_PUBLIC_URL || SUPABASE_URL)?.trim().replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const BUCKET = 'recipe-images';
const MAX_BYTES = 60 * 1024;
const PAGE_SIZE = 1000;
const LIMIT = Math.max(Number(process.env.RECIPE_LOCAL_LIMIT || '0'), 0);
const START = Math.max(Number(process.env.RECIPE_LOCAL_START || '0'), 0);
const CONCURRENCY = Math.min(Math.max(Number(process.env.RECIPE_LOCAL_CONCURRENCY || '2'), 1), 4);
const DELAY_MS = Math.max(Number(process.env.RECIPE_LOCAL_DELAY_MS || '2500'), 500);
const RETRY_FAILED = process.env.RECIPE_LOCAL_RETRY_FAILED !== '0';
const FORCE = process.env.RECIPE_LOCAL_FORCE === '1';
const MIRROR_EXISTING = process.env.RECIPE_LOCAL_MIRROR_EXISTING !== '0';
const GOOGLE_MISSING = process.env.RECIPE_LOCAL_GOOGLE_MISSING !== '0';
const CATALOG_ONLY = process.env.RECIPE_LOCAL_CATALOG_ONLY === '1';

if (!SUPABASE_URL || !SERVICE_KEY || !SUPABASE_PUBLIC_URL) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY locally. This script only reads from Supabase and never writes to it.');
}

const authHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  Accept: 'application/json',
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const now = () => new Date().toISOString();

async function ensureDirs() {
  await Promise.all([
    fs.mkdir(ROOT, { recursive: true }),
    fs.mkdir(IMAGE_ROOT, { recursive: true }),
    fs.mkdir(MANIFEST_DIR, { recursive: true }),
    fs.mkdir(LOG_DIR, { recursive: true }),
  ]);
}

async function supabase(pathname, options = {}, attempts = 6) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, {
        ...options,
        headers: { ...authHeaders, 'Content-Type': 'application/json', ...(options.headers || {}) },
      });
      const text = await response.text();
      if (response.ok) return { data: text ? JSON.parse(text) : null, response };
      if (response.status === 429 || response.status >= 500) {
        await sleep(Math.min(30_000, 1000 * 2 ** i));
        continue;
      }
      throw new Error(`${response.status} ${pathname}: ${text}`);
    } catch (error) {
      last = error;
      if (i < attempts - 1) await sleep(Math.min(30_000, 1000 * 2 ** i));
    }
  }
  throw last || new Error(`Supabase request failed: ${pathname}`);
}

async function verifySupabaseReadAccess() {
  const { data, response } = await supabase(
    'recipes?select=id,name&order=id.asc&limit=1',
    { headers: { Prefer: 'count=exact' } },
    3,
  );
  const contentRange = response.headers.get('content-range') || '';
  const totalMatch = contentRange.match(/\/(\d+)$/);
  const total = totalMatch ? Number(totalMatch[1]) : null;
  if (!Array.isArray(data)) throw new Error('Supabase recipes response is not an array.');
  if (total === 0 || (total === null && data.length === 0)) {
    throw new Error(`Supabase read returned 0 recipes. Verify SUPABASE_URL points to the intended project and the supplied key has read access to public.recipes. URL=${SUPABASE_URL}`);
  }
  return { total, sample: data[0] || null };
}

function unwrap(result) {
  return result?.data ?? result;
}

function publicStorageUrl(storageKey) {
  if (!storageKey) return null;
  const encoded = String(storageKey).split('/').map(encodeURIComponent).join('/');
  return `${SUPABASE_PUBLIC_URL}/storage/v1/object/public/${BUCKET}/${encoded}`;
}

async function fetchAllRecipes() {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const result = await supabase(`recipes?select=id,name&order=id.asc&limit=${PAGE_SIZE}&offset=${offset}`);
    const page = unwrap(result);
    rows.push(...(page || []).filter((r) => r?.id && String(r.name || '').trim()));
    if (!page || page.length < PAGE_SIZE) break;
  }
  return rows;
}