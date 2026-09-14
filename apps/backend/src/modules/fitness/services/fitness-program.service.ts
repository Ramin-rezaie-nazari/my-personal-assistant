import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/database/prisma.service';
import { CompleteFitnessProgramSessionDto, FitnessProgramQueryDto, StartFitnessProgramDto, UpdateFitnessProgramStatusDto } from '../dto/fitness-program.dto';

@Injectable()
export class FitnessProgramService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: FitnessProgramQueryDto) {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);
    const offset = Math.max(query.offset ?? 0, 0);
    const filters: Prisma.Sql[] = [Prisma.sql`p."contentStatus" = 'published'`];
    if (query.discipline) filters.push(Prisma.sql`p."discipline" = ${query.discipline}`);
    if (query.goal) filters.push(Prisma.sql`p."goal" = ${query.goal}`);
    if (query.level) filters.push(Prisma.sql`p."level" = ${query.level}`);
    const where = Prisma.join(filters, ' AND ');
    const [items, countRows] = await Promise.all([
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT p.*, v."id" AS "versionId", v."version", v."publishedAt",
          COUNT(s."id")::int AS "sessionCount"
        FROM "FitnessProgram" p
        JOIN "FitnessProgramVersion" v ON v."programId" = p."id"
          AND v."version" = (SELECT MAX(v2."version") FROM "FitnessProgramVersion" v2 WHERE v2."programId" = p."id" AND v2."publishedAt" IS NOT NULL)
        LEFT JOIN "FitnessProgramSession" s ON s."programVersionId" = v."id"
        WHERE ${where}
        GROUP BY p."id", v."id"
        ORDER BY p."goal" ASC, p."name" ASC
        LIMIT ${limit} OFFSET ${offset}
      `),
      this.prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`SELECT COUNT(*)::bigint AS count FROM "FitnessProgram" p WHERE ${where}`),
    ]);
    return { items, total: Number(countRows[0]?.count ?? 0), limit, offset };
  }

  async get(programId: string, userId?: string) {
    const programs = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT p.*, v."id" AS "versionId", v."version", v."publishedAt"
      FROM "FitnessProgram" p
      JOIN "FitnessProgramVersion" v ON v."programId" = p."id"
        AND v."version" = (SELECT MAX(v2."version") FROM "FitnessProgramVersion" v2 WHERE v2."programId" = p."id" AND v2."publishedAt" IS NOT NULL)
      WHERE p."id" = ${programId} AND p."contentStatus" = 'published'
      LIMIT 1
    `);
    if (!programs[0]) throw new NotFoundException('Fitness program not found');
    const versionId = programs[0].versionId as string;
    const [sessions, assignment] = await Promise.all([
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT * FROM "FitnessProgramSession"
        WHERE "programVersionId" = ${versionId}
        ORDER BY "weekNumber" ASC, "dayNumber" ASC
      `),
      userId
        ? this.prisma.fitnessPlanAssignment.findUnique({ where: { userId_programVersionId: { userId, programVersionId: versionId } } })
        : Promise.resolve(null),
    ]);
    return { ...programs[0], sessions, assignment };
  }

  async start(userId: string, dto: StartFitnessProgramDto) {
    const program = await this.get(dto.programId, userId);
    if (program.assignment && program.assignment.status !== 'cancelled') return program;
    const versionId = program.versionId as string;
    await this.prisma.fitnessPlanAssignment.upsert({
      where: { userId_programVersionId: { userId, programVersionId: versionId } },
      create: { id: randomUUID(), userId, programVersionId: versionId, startedOn: new Date(), status: 'active' },
      update: { startedOn: new Date(), status: 'active', currentWeek: 1, currentDay: 1, completedSessions: 0, lastSessionAt: null },
    });
    return this.get(dto.programId, userId);
  }

  async completeSession(userId: string, programId: string, dto: CompleteFitnessProgramSessionDto) {
    const program = await this.get(programId, userId);
    const assignment = program.assignment;
    if (!assignment || assignment.status !== 'active') throw new BadRequestException('Program is not active');
    const sessionExists = program.sessions.some((session) => session.weekNumber === dto.week && session.dayNumber === dto.day);
    if (!sessionExists) throw new BadRequestException('Program session does not exist');
    const sessionsThisWeek = program.sessions.filter((session) => session.weekNumber === dto.week);
    const lastWeek = program.durationWeeks;
    const isLastSession = dto.week === lastWeek && dto.day === sessionsThisWeek.length;
    const completedSessions = assignment.completedSessions + 1;
    const nextWeek = isLastSession ? lastWeek : dto.day >= sessionsThisWeek.length ? dto.week + 1 : dto.week;
    const nextDay = isLastSession ? sessionsThisWeek.length : dto.day >= sessionsThisWeek.length ? 1 : dto.day + 1;
    await this.prisma.fitnessPlanAssignment.update({
      where: { id: assignment.id },
      data: {
        completedSessions,
        currentWeek: nextWeek,
        currentDay: nextDay,
        lastSessionAt: new Date(),
        status: isLastSession ? 'completed' : 'active',
      },
    });
    return this.get(programId, userId);
  }

  async updateStatus(userId: string, programId: string, dto: UpdateFitnessProgramStatusDto) {
    const program = await this.get(programId, userId);
    if (!program.assignment) throw new NotFoundException('Program assignment not found');
    await this.prisma.fitnessPlanAssignment.update({ where: { id: program.assignment.id }, data: { status: dto.status } });
    return this.get(programId, userId);
  }

  async current(userId: string) {
    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT a.*, p."id" AS "programId", p."slug", p."name", p."nameFa", p."discipline", p."goal", p."level", p."durationWeeks", p."sessionsPerWeek", p."sessionDurationMin",
             s."id" AS "sessionId", s."title" AS "sessionTitle", s."focus" AS "sessionFocus", s."durationMin" AS "sessionDurationMinCurrent", s."sessionPayload"
      FROM "FitnessPlanAssignment" a
      JOIN "FitnessProgramVersion" v ON v."id" = a."programVersionId"
      JOIN "FitnessProgram" p ON p."id" = v."programId"
      LEFT JOIN "FitnessProgramSession" s ON s."programVersionId" = v."id" AND s."weekNumber" = a."currentWeek" AND s."dayNumber" = a."currentDay"
      WHERE a."userId" = ${userId} AND a."status" IN ('active','paused')
      ORDER BY a."updatedAt" DESC
      LIMIT 1
    `);
    return rows[0] ?? null;
  }
}
