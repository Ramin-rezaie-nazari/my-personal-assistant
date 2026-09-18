import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class FitnessProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string) {
    const [workouts, performances, assignments] = await Promise.all([
      this.prisma.$queryRaw<Array<{ count: bigint; minutes: number; calories: number }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count,
               COALESCE(SUM("durationMinutes"), 0)::int AS minutes,
               COALESCE(SUM("caloriesBurned"), 0)::int AS calories
        FROM "Workout"
        WHERE "userId" = ${userId}
      `),
      this.prisma.$queryRaw<Array<{ count: bigint; completedRate: number | null; avgDifficulty: number | null }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count,
               AVG("completionRate") AS "completedRate",
               AVG("perceivedDifficulty") AS "avgDifficulty"
        FROM "WorkoutPerformance"
        WHERE "userId" = ${userId}
      `),
      this.prisma.$queryRaw<Array<{ id: string; status: string; currentWeek: number; currentDay: number; completedSessions: number; durationWeeks: number; sessionsPerWeek: number; programName: string }>>(Prisma.sql`
        SELECT a."id", a."status", a."currentWeek", a."currentDay", a."completedSessions",
               p."durationWeeks", p."sessionsPerWeek", p."name" AS "programName"
        FROM "FitnessPlanAssignment" a
        JOIN "FitnessProgramVersion" v ON v."id" = a."programVersionId"
        JOIN "FitnessProgram" p ON p."id" = v."programId"
        WHERE a."userId" = ${userId}
        ORDER BY a."updatedAt" DESC
      `),
    ]);

    const workout = workouts[0] ?? { count: 0n, minutes: 0, calories: 0 };
    const performance = performances[0] ?? { count: 0n, completedRate: null, avgDifficulty: null };
    const activeProgram = assignments.find((item) => ['active', 'paused'].includes(item.status)) ?? null;

    return {
      workouts: Number(workout.count),
      workoutMinutes: Number(workout.minutes),
      caloriesBurned: Number(workout.calories),
      performanceRecords: Number(performance.count),
      averageCompletionRate: performance.completedRate == null ? null : Math.round(performance.completedRate * 100) / 100,
      averageDifficulty: performance.avgDifficulty == null ? null : Math.round(performance.avgDifficulty * 100) / 100,
      activeProgram: activeProgram
        ? {
            assignmentId: activeProgram.id,
            programName: activeProgram.programName,
            status: activeProgram.status,
            currentWeek: activeProgram.currentWeek,
            currentDay: activeProgram.currentDay,
            completedSessions: activeProgram.completedSessions,
            totalSessions: activeProgram.durationWeeks * activeProgram.sessionsPerWeek,
            completionPercent: Math.min(
              100,
              Math.round((activeProgram.completedSessions / Math.max(activeProgram.durationWeeks * activeProgram.sessionsPerWeek, 1)) * 100),
            ),
          }
        : null,
    };
  }
}
