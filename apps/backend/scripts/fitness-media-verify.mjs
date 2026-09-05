import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const CONCURRENCY = Number(process.env.FITNESS_MEDIA_VERIFY_CONCURRENCY ?? 8);

async function verifyUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() ?? '';
    return {
      ok: response.ok && contentType === 'image/webp',
      status: response.status,
      contentType,
    };
  } catch (error) {
    return { ok: false, status: 0, contentType: '', error: error instanceof Error ? error.message : String(error) };
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
        console.error(`${item.exerciseId}#${item.position}: invalid WebP (${result.status}, ${result.contentType}) ${item.webpUrl}`);
      }
    }
  });
  await Promise.all(workers);

  console.log(`Verified ${media.length} approved WebP assets; ${failed} failed.`);
  if (failed > 0) process.exitCode = 2;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
