import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../common/database/prisma.service';
import { FitnessDiscipline } from '../models/fitness.model';

export type FitnessProgress = {
  discipline: FitnessDiscipline;
  currentLevel: number;
  sessionsCompleted: number;
  completionRate: number | null;
  formScoreAvg: number | null;
  recentDifficulty: number | null;
  nextLevel: number | null;
};

@Injectable()
export class FitnessProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<FitnessProgress[]> {
    const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      SELECT "discipline", "currentLevel", "sessionsCompleted", "completionRate", "formScoreAvg", "recentDifficulty"
      FROM "FitnessDisciplineProgress"
      WHERE "userId" = ${userId}
      ORDER BY "discipline" ASC
    `);
    const byDiscipline = new Map(rows.map((row) => [String(row.discipline), row]));
    return (['gym', 'calisthenics', 'yoga'] as FitnessDiscipline[]).map((discipline) => this.toProgress(discipline, byDiscipline.get(discipline)));
  }

  async get(userId: string, discipline: FitnessDiscipline): Promise<FitnessProgress> {
    const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      SELECT "discipline", "currentLevel", "sessionsCompleted", "completionRate", "formScoreAvg", "recentDifficulty"
      FROM "FitnessDisciplineProgress"
      WHERE "userId" = ${userId} AND "discipline" = ${discipline}
      LIMIT 1
    `);
    return this.toProgress(discipline, rows[0]);
  }

  async recordSession(input: {
    userId: string;
    discipline: FitnessDiscipline;
    difficulty: number;
    completed: boolean;
    formScore?: number | null;
  }): Promise<FitnessProgress> {
    const difficulty = clamp(input.difficulty, 1, 10);
    const formScore = input.formScore == null ? null : clamp(input.formScore, 0, 100);
    const id = randomUUID();
    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO "FitnessDisciplineProgress" (
        "id", "userId", "discipline", "currentLevel", "sessionsCompleted", "completionRate",
        "formScoreAvg", "recentDifficulty", "createdAt", "updatedAt"
      )
      VALUES (
        ${id}, ${input.userId}, ${input.discipline}, ${difficulty},
        ${input.completed ? 1 : 0}, ${input.completed ? 1 : 0}, ${formScore}, ${difficulty}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT ("userId", "discipline") DO UPDATE SET
        "sessionsCompleted" = "FitnessDisciplineProgress"."sessionsCompleted" + CASE WHEN ${input.completed} THEN 1 ELSE 0 END,
        "completionRate" = CASE
          WHEN "FitnessDisciplineProgress"."sessionsCompleted" + 1 > 0 THEN
            ((COALESCE("FitnessDisciplineProgress"."completionRate", 0) * "FitnessDisciplineProgress"."sessionsCompleted") + CASE WHEN ${input.completed} THEN 1 ELSE 0 END)
            / ("FitnessDisciplineProgress"."sessionsCompleted" + 1)
          ELSE "FitnessDisciplineProgress"."completionRate"
        END,
        "formScoreAvg" = CASE
          WHEN ${formScore} IS NULL THEN "FitnessDisciplineProgress"."formScoreAvg"
          WHEN "FitnessDisciplineProgress"."formScoreAvg" IS NULL THEN ${formScore}
          ELSE (("FitnessDisciplineProgress"."formScoreAvg" * "FitnessDisciplineProgress"."sessionsCompleted") + ${formScore}) / ("FitnessDisciplineProgress"."sessionsCompleted" + 1)
        END,
        "recentDifficulty" = ${difficulty},
        "currentLevel" = CASE
          WHEN ${input.completed} AND ${difficulty} >= "FitnessDisciplineProgress"."currentLevel" AND COALESCE(${formScore}, 100) >= 80
            THEN LEAST(10, GREATEST("FitnessDisciplineProgress"."currentLevel", ${difficulty} + CASE WHEN "FitnessDisciplineProgress"."sessionsCompleted" >= 2 THEN 1 ELSE 0 END))
          ELSE "FitnessDisciplineProgress"."currentLevel"
        END,
        "updatedAt" = CURRENT_TIMESTAMP
    `);
    return this.get(input.userId, input.discipline);
  }

  private toProgress(discipline: FitnessDiscipline, row?: Record<string, unknown>): FitnessProgress {
    const currentLevel = clamp(Number(row?.currentLevel ?? 1), 1, 10);
    return {
      discipline,
      currentLevel,
      sessionsCompleted: Number(row?.sessionsCompleted ?? 0),
      completionRate: row?.completionRate == null ? null : Number(row.completionRate),
      formScoreAvg: row?.formScoreAvg == null ? null : Number(row.formScoreAvg),
      recentDifficulty: row?.recentDifficulty == null ? null : Number(row.recentDifficulty),
      nextLevel: currentLevel >= 10 ? null : currentLevel + 1,
    };
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? Math.round(value) : min));
}
