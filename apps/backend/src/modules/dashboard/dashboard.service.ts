import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getToday(userId: string, dateKey?: string) {
    const key = this.normalizeDateKey(dateKey);

    const [profile, nutritionProfile, dailyLog, meals] = await Promise.all([
      this.prisma.userProfile.findUnique({ where: { userId } }),
      this.prisma.nutritionProfile.findUnique({ where: { userId } }),
      this.prisma.dailyLog.findUnique({
        where: { userId_dateKey: { userId, dateKey: key } },
      }),
      this.prisma.meal.findMany({
        where: {
          userId,
          eatenAt: {
            gte: new Date(`${key}T00:00:00.000Z`),
            lt: new Date(`${this.nextDateKey(key)}T00:00:00.000Z`),
          },
        },
        select: {
          id: true,
          name: true,
          type: true,
          eatenAt: true,
          calories: true,
          protein: true,
          carbs: true,
          fat: true,
        },
        orderBy: { eatenAt: 'asc' },
      }),
    ]);

    const calories = dailyLog?.calories ?? 0;
    const protein = dailyLog?.protein ?? 0;
    const calorieGoal = nutritionProfile?.dailyCaloriesGoal ?? 0;
    const proteinGoal = nutritionProfile?.proteinGoalGrams ?? 0;
    const waterGoalMl = nutritionProfile?.waterGoalMl ?? 0;
    const waterMl = dailyLog?.waterMl ?? 0;

    return {
      dateKey: key,
      profile: profile
        ? {
            gender: profile.gender,
            birthDate: profile.birthDate,
            heightCm: profile.heightCm,
            weightKg: profile.weightKg,
            primaryGoal: profile.primaryGoal,
          }
        : null,
      nutrition: {
        calories,
        calorieGoal,
        caloriesRemaining: Math.max(calorieGoal - calories, 0),
        caloriesProgress:
          calorieGoal > 0 ? this.progress(calories, calorieGoal) : 0,
        protein,
        proteinGoal,
        proteinRemaining: Math.max(proteinGoal - protein, 0),
        proteinProgress:
          proteinGoal > 0 ? this.progress(protein, proteinGoal) : 0,
        waterMl,
        waterGoalMl,
        waterRemainingMl: Math.max(waterGoalMl - waterMl, 0),
        waterProgress:
          waterGoalMl > 0 ? this.progress(waterMl, waterGoalMl) : 0,
      },
      meals,
      mealCount: meals.length,
    };
  }

  async getOverview(userId: string, dateKey?: string) {
    const today = await this.getToday(userId, dateKey);
    const endKey = today.dateKey;
    const startKey = this.addDays(endKey, -6);
    const startDate = new Date(`${startKey}T00:00:00.000Z`);
    const endDate = new Date(`${this.nextDateKey(endKey)}T00:00:00.000Z`);

    const [dailyLogs, workouts, latestWorkout] = await Promise.all([
      this.prisma.dailyLog.findMany({
        where: { userId, dateKey: { gte: startKey, lte: endKey } },
        orderBy: { dateKey: 'asc' },
      }),
      this.prisma.workout.findMany({
        where: { userId, performedAt: { gte: startDate, lt: endDate } },
        orderBy: { performedAt: 'desc' },
      }),
      this.prisma.workout.findFirst({
        where: { userId },
        orderBy: { performedAt: 'desc' },
      }),
    ]);

    const loggedDays = dailyLogs.length;
    const totalCalories = dailyLogs.reduce(
      (sum, item) => sum + item.calories,
      0,
    );
    const totalProtein = dailyLogs.reduce((sum, item) => sum + item.protein, 0);
    const totalWaterMl = dailyLogs.reduce((sum, item) => sum + item.waterMl, 0);
    const workoutMinutes = workouts.reduce(
      (sum, item) => sum + item.durationMinutes,
      0,
    );
    const workoutCalories = workouts.reduce(
      (sum, item) => sum + item.caloriesBurned,
      0,
    );
    const workoutDays = new Set(
      workouts.map((item) => item.performedAt.toISOString().slice(0, 10)),
    ).size;
    const consistencyPercent = Math.round((loggedDays / 7) * 100);

    return {
      dateKey: endKey,
      range: { startKey, endKey },
      today,
      weekly: {
        loggedDays,
        consistencyPercent,
        totalCalories,
        totalProtein,
        totalWaterMl,
        averageCalories: loggedDays
          ? Math.round(totalCalories / loggedDays)
          : 0,
        averageProtein: loggedDays
          ? Math.round((totalProtein / loggedDays) * 10) / 10
          : 0,
        currentStreak: this.calculateStreak(
          dailyLogs.map((item) => item.dateKey),
          endKey,
        ),
      },
      workouts: {
        count: workouts.length,
        activeDays: workoutDays,
        totalMinutes: workoutMinutes,
        totalCaloriesBurned: workoutCalories,
        latest: latestWorkout
          ? {
              id: latestWorkout.id,
              name: latestWorkout.name,
              type: latestWorkout.type,
              durationMinutes: latestWorkout.durationMinutes,
              caloriesBurned: latestWorkout.caloriesBurned,
              performedAt: latestWorkout.performedAt,
            }
          : null,
      },
    };
  }

  private progress(value: number, goal: number): number {
    return Math.min(Math.round((value / goal) * 100), 100);
  }

  private normalizeDateKey(value?: string): string {
    const key = value ?? new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
      throw new Error('dateKey must use YYYY-MM-DD format');
    }

    const parsed = new Date(`${key}T00:00:00.000Z`);
    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== key
    ) {
      throw new Error('dateKey must be a valid calendar date');
    }

    return key;
  }

  private nextDateKey(key: string): string {
    return this.addDays(key, 1);
  }

  private addDays(key: string, amount: number): string {
    const date = new Date(`${key}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + amount);
    return date.toISOString().slice(0, 10);
  }

  private calculateStreak(dateKeys: string[], endKey: string): number {
    const dates = new Set(dateKeys);
    let streak = 0;
    let cursor = endKey;

    while (dates.has(cursor)) {
      streak += 1;
      cursor = this.addDays(cursor, -1);
    }

    return streak;
  }
}
