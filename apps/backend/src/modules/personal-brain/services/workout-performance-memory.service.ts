import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

export type ExerciseTrend = {
  exerciseId: string | null;
  exerciseName: string | null;
  sessions: number;
  firstScore: number | null;
  latestScore: number | null;
  scoreTrend: number | null;
  latestReps: number | null;
  latestLoadKg: number | null;
};

export type FitnessPerformanceMemory = {
  windowDays: number;
  sessions: number;
  averageForm: number | null;
  averageCompletion: number | null;
  averageDifficulty: number | null;
  averageRecovery: number | null;
  formTrend: number | null;
  completionTrend: number | null;
  recoveryTrend: number | null;
  disciplineSummary: Record<string, { sessions: number; averageForm: number | null; averageDifficulty: number | null }>;
  exerciseTrends: ExerciseTrend[];
};

type Row = {
  discipline: string;
  exerciseId: string | null;
  exerciseName: string | null;
  performedAt: Date;
  formScore: number | null;
  completionRate: number | null;
  perceivedDifficulty: number | null;
  recoveryScore: number | null;
  reps: number | null;
  loadKg: number | null;
};

@Injectable()
export class WorkoutPerformanceMemoryService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string, windowDays = 28): Promise<FitnessPerformanceMemory> {
    const safeDays = Math.min(365, Math.max(7, Math.round(windowDays)));
    const since = new Date(Date.now() - safeDays * 86400000);
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT "discipline","exerciseId","exerciseName","performedAt","formScore","completionRate","perceivedDifficulty","recoveryScore","reps","loadKg"
      FROM "WorkoutPerformance"
      WHERE "userId"=${userId} AND "performedAt">=${since}
      ORDER BY "performedAt" ASC
    `;

    const validForm = rows.filter(r => r.formScore !== null).map(r => r.formScore as number);
    const validCompletion = rows.filter(r => r.completionRate !== null).map(r => r.completionRate as number);
    const validDifficulty = rows.filter(r => r.perceivedDifficulty !== null).map(r => r.perceivedDifficulty as number);
    const validRecovery = rows.filter(r => r.recoveryScore !== null).map(r => r.recoveryScore as number);

    return {
      windowDays: safeDays,
      sessions: rows.length,
      averageForm: this.avg(validForm),
      averageCompletion: this.avg(validCompletion),
      averageDifficulty: this.avg(validDifficulty),
      averageRecovery: this.avg(validRecovery),
      formTrend: this.trend(rows.map(r => r.formScore)),
      completionTrend: this.trend(rows.map(r => r.completionRate)),
      recoveryTrend: this.trend(rows.map(r => r.recoveryScore)),
      disciplineSummary: this.disciplines(rows),
      exerciseTrends: this.exercises(rows),
    };
  }

  private avg(values: number[]): number | null {
    if (!values.length) return null;
    return Number((values.reduce((s, v) => s + v, 0) / values.length).toFixed(3));
  }

  private trend(values: Array<number | null>): number | null {
    const clean = values.filter((v): v is number => v !== null);
    if (clean.length < 4) return null;
    const split = Math.max(2, Math.floor(clean.length / 2));
    const first = this.avg(clean.slice(0, split));
    const latest = this.avg(clean.slice(-split));
    if (first === null || latest === null) return null;
    return Number((latest - first).toFixed(3));
  }

  private disciplines(rows: Row[]) {
    return Object.fromEntries(
      [...new Set(rows.map(r => r.discipline))].map(discipline => {
        const items = rows.filter(r => r.discipline === discipline);
        return [discipline, {
          sessions: items.length,
          averageForm: this.avg(items.filter(r => r.formScore !== null).map(r => r.formScore as number)),
          averageDifficulty: this.avg(items.filter(r => r.perceivedDifficulty !== null).map(r => r.perceivedDifficulty as number)),
        }];
      }),
    );
  }

  private exercises(rows: Row[]): ExerciseTrend[] {
    const keys = new Set(rows.map(r => `${r.exerciseId ?? ''}|${r.exerciseName ?? ''}`));
    return [...keys].map(key => {
      const items = rows.filter(r => `${r.exerciseId ?? ''}|${r.exerciseName ?? ''}` === key);
      const form = items.filter(r => r.formScore !== null).map(r => r.formScore as number);
      const first = form.length ? form[0] : null;
      const latest = form.length ? form[form.length - 1] : null;
      return {
        exerciseId: items[0]?.exerciseId ?? null,
        exerciseName: items[0]?.exerciseName ?? null,
        sessions: items.length,
        firstScore: first,
        latestScore: latest,
        scoreTrend: first !== null && latest !== null ? Number((latest - first).toFixed(3)) : null,
        latestReps: items.at(-1)?.reps ?? null,
        latestLoadKg: items.at(-1)?.loadKg ?? null,
      };
    }).sort((a, b) => b.sessions - a.sessions).slice(0, 30);
  }
}
