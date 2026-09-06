import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TARGET = Number(process.env.FITNESS_TARGET_PER_DISCIPLINE ?? 500);
const MIN_PER_LEVEL = Number(process.env.FITNESS_MIN_PER_LEVEL ?? Math.floor(TARGET / 10));
const DISCIPLINES = ['gym', 'calisthenics', 'yoga'];

async function main() {
  for (const discipline of DISCIPLINES) {
    const rows = await prisma.$queryRaw<Array<{ id: string; slug: string; sourceLevel: string | null }>>(Prisma.sql`
      SELECT c."id", c."slug", c."sourceLevel"
      FROM "FitnessExerciseCatalog" c
      WHERE c."discipline" = ${discipline}
        AND c."status" = 'published'
        AND (
          SELECT COUNT(*) FROM "FitnessExerciseMedia" m
          WHERE m."exerciseId" = c."id" AND m."status" = 'approved' AND m."format" = 'webp'
        ) >= 4
      ORDER BY c."slug" ASC, c."id" ASC
      LIMIT ${TARGET}
    `);

    if (rows.length < TARGET) {
      throw new Error(`${discipline}: only ${rows.length}/${TARGET} publishable movements are available`);
    }

    const perLevel = Math.floor(rows.length / 10);
    const extra = rows.length % 10;
    let cursor = 0;
    for (let level = 1; level <= 10; level += 1) {
      const take = perLevel + (level <= extra ? 1 : 0);
      const slice = rows.slice(cursor, cursor + take);
      cursor += take;
      if (slice.length < MIN_PER_LEVEL) {
        throw new Error(`${discipline}: level ${level} would contain only ${slice.length}/${MIN_PER_LEVEL}`);
      }
      await prisma.$transaction(
        slice.map((row) => prisma.$executeRaw(Prisma.sql`
          UPDATE "FitnessExerciseCatalog"
          SET "difficultyLevel" = ${level}, "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ${row.id}
        `)),
      );
    }

    console.log(`${discipline}: balanced ${rows.length} movements across levels 1-10 (${perLevel}-${perLevel + (extra > 0 ? 1 : 0)} each)`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
