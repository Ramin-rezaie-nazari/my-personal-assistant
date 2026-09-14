import { randomUUID } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/database/prisma.service';
import { AddExerciseMediaDto, AddExerciseRelationshipDto, CreateExerciseDto, ExerciseQueryDto } from '../dto/exercise-content.dto';

@Injectable()
export class ExerciseContentService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ExerciseQueryDto) {
    const limit = Math.min(query.limit ?? 24, 100);
    const offset = query.offset ?? 0;
    const filters: Prisma.Sql[] = [Prisma.sql`"contentStatus" = 'published'`];

    if (query.search) {
      const value = `%${query.search.trim()}%`;
      filters.push(Prisma.sql`("name" ILIKE ${value} OR COALESCE("nameFa", '') ILIKE ${value} OR "aliases"::text ILIKE ${value})`);
    }
    if (query.discipline) filters.push(Prisma.sql`"discipline" = ${query.discipline}`);
    if (query.muscle) {
      filters.push(Prisma.sql`("primaryMuscles" @> ${JSON.stringify([query.muscle])}::jsonb OR "secondaryMuscles" @> ${JSON.stringify([query.muscle])}::jsonb)`);
    }
    if (query.equipment) filters.push(Prisma.sql`"equipment" @> ${JSON.stringify([query.equipment])}::jsonb`);
    if (query.difficulty) filters.push(Prisma.sql`"difficulty" = ${query.difficulty}`);
    if (query.goal) filters.push(Prisma.sql`"goals" @> ${JSON.stringify([query.goal])}::jsonb`);

    const where = Prisma.join(filters, ' AND ');
    const [items, countRows] = await Promise.all([
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT "id","slug","name","nameFa","aliases","discipline","movementPattern",
               "primaryMuscles","secondaryMuscles","equipment","difficulty","goals",
               "instructions","coachCues","commonMistakes","cautions","contentStatus",
               "sourceProvider","sourceLicense","sourceAttribution","createdAt","updatedAt"
        FROM "Exercise"
        WHERE ${where}
        ORDER BY "name" ASC
        LIMIT ${limit} OFFSET ${offset}
      `),
      this.prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`SELECT COUNT(*)::bigint AS count FROM "Exercise" WHERE ${where}`),
    ]);

    return { items, total: Number(countRows[0]?.count ?? 0), limit, offset };
  }

  async get(id: string) {
    const exercises = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT * FROM "Exercise" WHERE "id" = ${id} LIMIT 1
    `);
    if (!exercises[0]) throw new NotFoundException('Exercise not found');

    const [media, relationships] = await Promise.all([
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT * FROM "ExerciseMedia"
        WHERE "exerciseId" = ${id} AND "status" = 'approved'
        ORDER BY "position" ASC, "createdAt" ASC
      `),
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT r.*, e."slug", e."name", e."nameFa"
        FROM "ExerciseRelationship" r
        JOIN "Exercise" e ON e."id" = r."toExerciseId"
        WHERE r."fromExerciseId" = ${id}
        ORDER BY r."kind" ASC, r."priority" ASC, e."name" ASC
      `),
    ]);

    return { ...exercises[0], media, relationships };
  }

  async create(dto: CreateExerciseDto) {
    const id = randomUUID();
    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO "Exercise" (
        "id","slug","name","nameFa","aliases","discipline","movementPattern",
        "primaryMuscles","secondaryMuscles","equipment","difficulty","goals",
        "instructions","coachCues","commonMistakes","cautions","contentStatus",
        "createdAt","updatedAt"
      ) VALUES (
        ${id},${dto.slug},${dto.name},${dto.nameFa ?? null},${JSON.stringify(dto.aliases ?? [])}::jsonb,
        ${dto.discipline},${dto.movementPattern ?? null},${JSON.stringify(dto.primaryMuscles)}::jsonb,
        ${JSON.stringify(dto.secondaryMuscles ?? [])}::jsonb,${JSON.stringify(dto.equipment)}::jsonb,
        ${dto.difficulty},${JSON.stringify(dto.goals)}::jsonb,${dto.instructions ?? null},
        ${JSON.stringify(dto.coachCues ?? [])}::jsonb,${JSON.stringify(dto.commonMistakes ?? [])}::jsonb,
        ${JSON.stringify(dto.cautions ?? [])}::jsonb,${dto.contentStatus ?? 'draft'},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
      )
    `);
    return this.get(id);
  }

  async addMedia(exerciseId: string, dto: AddExerciseMediaDto) {
    await this.assertExercise(exerciseId);
    const id = randomUUID();
    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO "ExerciseMedia" (
        "id","exerciseId","kind","url","sourceUrl","sourceProvider","license","attribution",
        "mimeType","durationSeconds","width","height","language","posterUrl","checksum",
        "status","position","createdAt","updatedAt"
      ) VALUES (
        ${id},${exerciseId},${dto.kind},${dto.url},${dto.sourceUrl ?? null},${dto.sourceProvider},${dto.license},
        ${dto.attribution ?? null},${dto.mimeType ?? null},${dto.durationSeconds ?? null},${dto.width ?? null},
        ${dto.height ?? null},${dto.language ?? null},${dto.posterUrl ?? null},${dto.checksum ?? null},
        ${dto.status ?? 'pending'},${dto.position ?? 0},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
      )
    `);
    return this.get(id).catch(() => ({ id, exerciseId }));
  }

  async addRelationship(fromExerciseId: string, dto: AddExerciseRelationshipDto) {
    await this.assertExercise(fromExerciseId);
    await this.assertExercise(dto.toExerciseId);
    const id = randomUUID();
    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO "ExerciseRelationship" (
        "id","fromExerciseId","toExerciseId","kind","priority","notes","createdAt"
      ) VALUES (${id},${fromExerciseId},${dto.toExerciseId},${dto.kind},${dto.priority ?? 0},${dto.notes ?? null},CURRENT_TIMESTAMP)
      ON CONFLICT ("fromExerciseId","toExerciseId","kind")
      DO UPDATE SET "priority" = EXCLUDED."priority", "notes" = EXCLUDED."notes"
    `);
    return { id, fromExerciseId, toExerciseId: dto.toExerciseId, kind: dto.kind };
  }

  private async assertExercise(id: string) {
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT "id" FROM "Exercise" WHERE "id" = ${id} LIMIT 1`);
    if (!rows[0]) throw new NotFoundException('Exercise not found');
  }
}
