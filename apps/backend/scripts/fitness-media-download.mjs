import sharp from 'sharp';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.FITNESS_MEDIA_BUCKET ?? 'fitness-images';
const MAX_BYTES = Math.min(Math.max(Number(process.env.FITNESS_MEDIA_MAX_BYTES ?? 65536), 32768), 262144);
const CONCURRENCY = Math.min(Math.max(Number(process.env.FITNESS_MEDIA_CONCURRENCY ?? 6), 1), 8);
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function ensureBucket() {
  const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, file_size_limit: MAX_BYTES, allowed_mime_types: ['image/webp'] }) });
  if (response.ok || response.status === 409) return;
  throw new Error(`Bucket setup failed: ${response.status} ${await response.text()}`);
}
async function download(url) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'MYPA-FitnessMedia/1.0' } });
      if (!response.ok) throw new Error(`source ${response.status}`);
      const type = response.headers.get('content-type')?.split(';')[0]?.toLowerCase() || '';
      if (!type.startsWith('image/')) throw new Error(`source content-type ${type || 'unknown'}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      if (attempt === 4) throw error;
      await sleep(500 * 2 ** attempt);
    }
  }
  throw new Error('unreachable');
}
async function toWebp(input) {
  for (const width of [1200, 1024, 900, 800, 720, 640, 560, 480, 400, 320]) {
    for (const quality of [78, 72, 66, 60, 54, 48, 42, 36, 30]) {
      const out = await sharp(input).rotate().resize({ width, withoutEnlargement: true, fit: 'inside' }).webp({ quality, effort: 6 }).toBuffer();
      if (out.byteLength <= MAX_BYTES) return out;
    }
  }
  throw new Error(`Unable to produce WebP <= ${MAX_BYTES} bytes`);
}
async function upload(key, bytes) {
  const encoded = key.split('/').map(encodeURIComponent).join('/');
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encoded}`, { method: 'POST', headers: { ...headers, 'Content-Type': 'image/webp', 'Cache-Control': '31536000', 'x-upsert': 'true' }, body: bytes });
    if (response.ok) return;
    const text = await response.text();
    if (response.status !== 429 && response.status < 500) throw new Error(`Storage upload ${response.status}: ${text}`);
    await sleep(500 * 2 ** attempt);
  }
  throw new Error(`Storage upload failed: ${key}`);
}
async function main() {
  await ensureBucket();
  const media = await prisma.$queryRaw<Array<{ id: string; exerciseId: string; position: number; sourceUrl: string; webpUrl: string }>>(Prisma.sql`
    SELECT "id", "exerciseId", "position", "sourceUrl", "webpUrl"
    FROM "FitnessExerciseMedia"
    WHERE "status" = 'approved' AND "format" = 'webp'
      AND "sourceUrl" IS NOT NULL
    ORDER BY "exerciseId", "position"
  `);
  if (media.length === 0) throw new Error('No approved fitness source media exists; refusing to report a green media mirror.');
  let cursor = 0;
  let failed = 0;
  let processed = 0;
  const worker = async () => {
    while (true) {
      const index = cursor++;
      if (index >= media.length) return;
      const item = media[index];
      try {
        const source = await download(item.sourceUrl);
        const webp = await toWebp(source);
        const key = `fitness/${item.exerciseId}/${item.position}.webp`;
        await upload(key, webp);
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`;
        await prisma.$executeRaw(Prisma.sql`
          UPDATE "FitnessExerciseMedia"
          SET "webpUrl" = ${publicUrl}, "format" = 'webp', "updatedAt" = NOW()
          WHERE "id" = ${item.id}
        `);
        processed += 1;
        if (processed % 50 === 0) console.log(JSON.stringify({ progress: processed, total: media.length, failed }));
      } catch (error) {
        failed += 1;
        console.error(`[FITNESS MEDIA FAILED] ${item.exerciseId}#${item.position}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, media.length) }, worker));
  const mirrored = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
    SELECT count(*) FROM "FitnessExerciseMedia"
    WHERE "status" = 'approved' AND "format" = 'webp'
      AND "webpUrl" LIKE ${`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/%`}
  `);
  const mirroredCount = Number(mirrored[0]?.count ?? 0);
  console.log(JSON.stringify({ status: failed || mirroredCount !== media.length ? 'failed' : 'complete', approvedSourceMedia: media.length, processed, failed, mirroredCount, bucket: BUCKET }, null, 2));
  if (failed || mirroredCount !== media.length) process.exitCode = 2;
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
