import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

export type WorkoutWeeklySummary = {
  fromDateKey: string;
  toDateKey: string;
  workoutCount: number;
  activeDays: number;
  totalMinutes: number;
  totalCaloriesBurned: number;
  averageMinutesPerWorkout: number;
  consistencyPercent: number;
  currentStreak: number;
  lastWorkout: {
    name: string;
    type: string;
    performedAt: string;
  } | null;
};

@Injectable()
export class WorkoutService {
  constructor(private readonly prisma: PrismaService) {}

  async createWorkout(
    userId: string,
    data: {
      name: string;
      type: string;
      durationMinutes: number;
      caloriesBurned: number;
      performedAt?: string;
    },
  ) {
    this.validateNumbers(data.durationMinutes, data.caloriesBurned);

    return this.prisma.workout.create({
      data: {
        userId,
        name: data.name.trim(),
        type: data.type.trim(),
        durationMinutes: Math.round(data.durationMinutes),
        caloriesBurned: Math.round(data.caloriesBurned),
        performedAt: data.performedAt ? new Date(data.performedAt) : new Date(),
      },
    });
  }

  async getWorkouts(userId: string) {
    return this.prisma.workout.findMany({
      where: { userId },
      orderBy: { performedAt: 'desc' },
    });
  }

  async updateWorkout(
    userId: string,
    workoutId: string,
    data: {
      name?: string;
      type?: string;
      durationMinutes?: number;
      caloriesBurned?: number;
      performedAt?: string;
    },
  ) {
    const existing = await this.prisma.workout.findFirst({
      where: { id: workoutId, userId },
    });

    if (!existing) {
      throw new NotFoundException('Workout not found');
    }

    if (
      data.durationMinutes !== undefined ||
      data.caloriesBurned !== undefined
    ) {
      this.validateNumbers(
        data.durationMinutes ?? existing.durationMinutes,
        data.caloriesBurned ?? existing.caloriesBurned,
      );
    }

    return this.prisma.workout.update({
      where: { id: workoutId },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.type !== undefined ? { type: data.type.trim() } : {}),
        ...(data.durationMinutes !== undefined
          ? { durationMinutes: Math.round(data.durationMinutes) }
          : {}),
        ...(data.caloriesBurned !== undefined
          ? { caloriesBurned: Math.round(data.caloriesBurned) }
          : {}),
        ...(data.performedAt !== undefined
          ? { performedAt: new Date(data.performedAt) }
          : {}),
      },
    });
  }

  async deleteWorkout(userId: string, workoutId: string) {
    const result = await this.prisma.workout.deleteMany({
      where: { id: workoutId, userId },
    });

    if (result.count === 0) {
      throw new NotFoundException('Workout not found');
    }

    return { deleted: true };
  }

  async getWeeklySummary(userId: string, dateKey = new Date().toISOString().slice(0, 10)) {
    this.assertDateKey(dateKey);
    const toDate = new Date(`${dateKey}T23:59:59.999Z`);
    const fromDate = new Date(toDate);
    fromDate.setUTCDate(fromDate.getUTCDate() - 6);

    const workouts = await this.prisma.workout.findMany({
      where: {
        userId,
        performedAt: { gte: fromDate, lte: toDate },
      },
      orderBy: { performedAt: 'desc' },
    });

    const days = new Map<string, number>();
    let totalMinutes = 0;
    let totalCaloriesBurned = 0;

    for (const workout of workouts) {
      const key = workout.performedAt.toISOString().slice(0, 10);
      days.set(key, (days.get(key) ?? 0) + 1);
      totalMinutes += workout.durationMinutes;
      totalCaloriesBurned += workout.caloriesBurned;
    }

    let currentStreak = 0;
    const cursor = new Date(`${dateKey}T00:00:00.000Z`);
    for (let i = 0; i < 7; i += 1) {
      const key = cursor.toISOString().slice(0, 10);
      if (!days.has(key)) break;
      currentStreak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    return {
      fromDateKey: fromDate.toISOString().slice(0, 10),
      toDateKey: dateKey,
      workoutCount: workouts.length,
      activeDays: days.size,
      totalMinutes,
      totalCaloriesBurned,
      averageMinutesPerWorkout:
        workouts.length === 0 ? 0 : Math.round(totalMinutes / workouts.length),
      consistencyPercent: Math.round((days.size / 7) * 100),
      currentStreak,
      lastWorkout: workouts[0]
        ? {
            name: workouts[0].name,
            type: workouts[0].type,
            performedAt: workouts[0].performedAt.toISOString(),
          }
        : null,
    } satisfies WorkoutWeeklySummary;
  }

  private validateNumbers(durationMinutes: number, caloriesBurned: number) {
    if (!Number.isFinite(durationMinutes) || durationMinutes < 0) {
      throw new BadRequestException('durationMinutes must be a non-negative number');
    }

    if (!Number.isFinite(caloriesBurned) || caloriesBurned < 0) {
      throw new BadRequestException('caloriesBurned must be a non-negative number');
    }
  }

  private assertDateKey(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException('dateKey must use YYYY-MM-DD format');
    }

    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
      throw new BadRequestException('dateKey must be a valid calendar date');
    }
  }
}
