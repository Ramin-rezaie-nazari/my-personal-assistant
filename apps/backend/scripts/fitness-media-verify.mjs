import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const CONCURRENCY = Math.min(Math.max(Number(process.env.FITNESS_MEDIA_VERIFY_CONCURRENCY ?? 8), 1), 16);

async function inspectResponse(response) {
  const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() ?? '';
  const contentLength = Number(response.headers.get('content-length') ?? '0');
  return {
    ok: response.ok && contentType === 'image/webp' && (contentLength === 0 || contentLength > 32),
    status: response.status,
    contentType,
    contentLength,
  };
}

async function verifyUrl(url) {
  let headError = '';
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    const result = await inspectResponse(response);
    if (result.ok) return result;
    headError = `HEAD ${result.status} ${result.contentType}`;
  } catch (error) {
    headError = error instanceof Error ? error.message : String(error);
  }

  try {
    const response = await fetch(url, { method: 'GET', redirect: 'follow', headers: { Range: 'bytes=0-63' } });
    const result = await inspectResponse(response);
    if (result.ok) return result;
    return { ...result, error: `GET failed after ${headError}` };
  } catch (error) {
    return { ok: false, status: 0, contentType: '', contentLength: 0, error: `GET failed after ${headError}: ${error instanceof Error ? error.message : String(error)}` };
  }
}

async function main() {
  const media = await prisma.$queryRaw<Array<{ id: string; exerciseId: string; position: number; webpUrl: string }>>(Prisma.sql`
    SELECT "id", "exerciseId", "position", "webpUrl"
    FROM "FitnessExerciseMedia"
    WHERE "status" = 'approved' AND "format" = 'webp'
    ORDER BY "exerciseId", "position"
  `);

  let cursor = 0;
  let failed = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= media.length) return;
      const item = media[index];
      const result = await verifyUrl(item.webpUrl);
      if (!result.ok) {
        failed += 1;
        console.error(`${item.exerciseId}#${item.position}: invalid WebP (${result.status}, ${result.contentType}) ${result.error ?? ''} ${item.webpUrl}`);
      }
    }
  });
  await Promise.all(workers);

  console.log(`Verified ${media.length} approved WebP assets; ${failed} failed.`);
  if (media.length === 0) {
    console.error('No approved WebP assets were found; corpus verification cannot pass on an empty dataset.');
    process.exitCode = 2;
  } else if (failed > 0) {
    process.exitCode = 2;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
