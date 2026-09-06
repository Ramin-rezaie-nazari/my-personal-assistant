import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const TARGET = Number(process.env.FITNESS_TARGET_PER_DISCIPLINE ?? 500);
const MIN_PER_LEVEL = Number(process.env.FITNESS_MIN_PER_LEVEL ?? Math.floor(TARGET / 10));
const DISCIPLINES = ['gym', 'calisthenics', 'yoga'];
const LEVELS = Array.from({ length: 10 }, (_, index) => index + 1);

async function main() {
  const rows = await prisma.$queryRaw<Array<{
    discipline: string;
    total: number;
    published: number;
    withFourWebp: number;
    minLevel: number | null;
    maxLevel: number | null;
  }>>(Prisma.sql`
    SELECT
      c."discipline",
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE c."status" = 'published')::int AS published,
      COUNT(*) FILTER (
        WHERE c."status" = 'published' AND (
          SELECT COUNT(DISTINCT m."webpUrl")
          FROM "FitnessExerciseMedia" m
          WHERE m."exerciseId" = c."id"
            AND m."status" = 'approved'
            AND m."format" = 'webp'
            AND m."webpUrl" <> ''
        ) >= 4
      )::int AS "withFourWebp",
      MIN(c."difficultyLevel")::int AS "minLevel",
      MAX(c."difficultyLevel")::int AS "maxLevel"
    FROM "FitnessExerciseCatalog" c
    GROUP BY c."discipline"
    ORDER BY c."discipline";
  `);

  const byDiscipline = new Map(rows.map((row) => [row.discipline, row]));
  let failed = false;
  for (const discipline of DISCIPLINES) {
    const row = byDiscipline.get(discipline);
    const published = Number(row?.published ?? 0);
    const withFourWebp = Number(row?.withFourWebp ?? 0);
    const ready = published >= TARGET && withFourWebp >= TARGET;
    console.log(`${discipline}: published=${published}/${TARGET} fourWebp=${withFourWebp}/${TARGET} levels=${row?.minLevel ?? '-'}-${row?.maxLevel ?? '-'} ${ready ? 'PASS' : 'FAIL'}`);
    if (!ready) failed = true;
  }

  const levelRows = await prisma.$queryRaw<Array<{ discipline: string; level: number; count: number }>>(Prisma.sql`
    SELECT c."discipline", c."difficultyLevel"::int AS level, COUNT(*)::int AS count
    FROM "FitnessExerciseCatalog" c
    WHERE c."status" = 'published'
      AND (
        SELECT COUNT(*) FROM "FitnessExerciseMedia" m
        WHERE m."exerciseId" = c."id" AND m."status" = 'approved' AND m."format" = 'webp' AND m."webpUrl" <> ''
      ) >= 4
    GROUP BY c."discipline", c."difficultyLevel"
    ORDER BY c."discipline", c."difficultyLevel";
  `);
  const levelMap = new Map(levelRows.map((row) => [`${row.discipline}:${row.level}`, Number(row.count)]));
  for (const discipline of DISCIPLINES) {
    const counts = LEVELS.map((level) => levelMap.get(`${discipline}:${level}`) ?? 0);
    const bad = counts.some((count) => count < MIN_PER_LEVEL);
    console.log(`${discipline}: level distribution ${counts.join(',')} min=${Math.min(...counts)} required=${MIN_PER_LEVEL} ${bad ? 'FAIL' : 'PASS'}`);
    if (bad) failed = true;
  }

  const mediaProblems = await prisma.$queryRaw<Array<{ exerciseId: string; mediaCount: number; distinctWebp: number }>>(Prisma.sql`
    SELECT
      c."id" AS "exerciseId",
      COUNT(m."id")::int AS "mediaCount",
      COUNT(DISTINCT m."webpUrl")::int AS "distinctWebp"
    FROM "FitnessExerciseCatalog" c
    LEFT JOIN "FitnessExerciseMedia" m
      ON m."exerciseId" = c."id"
     AND m."status" = 'approved'
     AND m."format" = 'webp'
     AND m."webpUrl" <> ''
    WHERE c."status" = 'published'
    GROUP BY c."id"
    HAVING COUNT(DISTINCT m."webpUrl") < 4
    ORDER BY COUNT(DISTINCT m."webpUrl") ASC
    LIMIT 50;
  `);
  if (mediaProblems.length) {
    failed = true;
    console.error(`Found ${mediaProblems.length} published exercises with fewer than four distinct approved WebP assets.`);
  }

  if (failed) {
    console.error(`FITNESS CONTENT GATE FAILED: require ${TARGET} published movements, >=${MIN_PER_LEVEL} publishable movements in every difficulty level 1-10, and >=4 distinct approved WebP assets per movement in every discipline.`);
    process.exitCode = 2;
  } else {
    console.log('FITNESS CONTENT GATE PASSED.');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
