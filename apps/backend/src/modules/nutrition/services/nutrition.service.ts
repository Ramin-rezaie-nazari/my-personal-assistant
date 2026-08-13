import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

type MealTotals = {
  count: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

@Injectable()
export class NutritionService {
  constructor(private readonly prisma: PrismaService) {}

  async getLogs(userId: string, dateKey?: string) {
    const key = this.normalizeDateKey(dateKey);

    return this.prisma.nutritionLog.findMany({
      where: { userId, dateKey: key },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDailySummary(userId: string, dateKey?: string) {
    const key = this.normalizeDateKey(dateKey);
    const [logs, nutritionProfile, dailyLog] = await Promise.all([
      this.prisma.nutritionLog.findMany({
        where: { userId, dateKey: key },
        select: { calories: true, protein: true, carbs: true, fat: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.nutritionProfile.findUnique({
        where: { userId },
        select: { dailyCaloriesGoal: true, proteinGoalGrams: true, waterGoalMl: true },
      }),
      this.prisma.dailyLog.findUnique({
        where: { userId_dateKey: { userId, dateKey: key } },
        select: { calories: true, protein: true, waterMl: true },
      }),
    ]);

    const meals = logs.reduce<MealTotals>(
      (totals, log) => ({
        count: totals.count + 1,
        calories: totals.calories + (log.calories ?? 0),
        protein: totals.protein + (log.protein ?? 0),
        carbs: totals.carbs + (log.carbs ?? 0),
        fat: totals.fat + (log.fat ?? 0),
      }),
      { count: 0, calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    const calories = dailyLog?.calories ?? meals.calories;
    const protein = dailyLog?.protein ?? meals.protein;
    const waterMl = dailyLog?.waterMl ?? 0;
    const caloriesGoal = nutritionProfile?.dailyCaloriesGoal ?? null;
    const proteinGoal = nutritionProfile?.proteinGoalGrams ?? null;
    const waterGoal = nutritionProfile?.waterGoalMl ?? null;

    const percent = (value: number, goal: number | null) =>
      goal && goal > 0 ? Number(((value / goal) * 100).toFixed(2)) : null;
    const remaining = (value: number, goal: number | null) =>
      goal == null ? null : Math.max(0, Number((goal - value).toFixed(2)));
    const status = (value: number, goal: number | null) => {
      if (goal == null || goal <= 0) return 'unknown';
      if (value === goal) return 'on_target';
      return value < goal ? 'under' : 'over';
    };

    return {
      dateKey: key,
      meals: { ...meals, calories, protein },
      goals: { calories: caloriesGoal, protein: proteinGoal, waterMl: waterGoal },
      remaining: {
        calories: remaining(calories, caloriesGoal),
        protein: remaining(protein, proteinGoal),
        waterMl: remaining(waterMl, waterGoal),
      },
      progress: {
        caloriesPercent: percent(calories, caloriesGoal),
        proteinPercent: percent(protein, proteinGoal),
        waterPercent: percent(waterMl, waterGoal),
      },
      status: {
        calories: status(calories, caloriesGoal),
        protein: status(protein, proteinGoal),
        water: status(waterMl, waterGoal),
      },
    };
  }

  async createLog(
    userId: string,
    data: {
      dateKey?: string;
      mealType: string;
      title: string;
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    },
  ) {
    const dateKey = this.normalizeDateKey(data.dateKey);
    const calories = data.calories ?? 0;
    const protein = data.protein ?? 0;
    const { dateKey: _dateKey, ...logData } = data;

    return this.prisma.$transaction(async (tx) => {
      const log = await tx.nutritionLog.create({
        data: {
          userId,
          dateKey,
          ...logData,
        },
      });

      await tx.dailyLog.upsert({
        where: { userId_dateKey: { userId, dateKey } },
        update: {
          calories: { increment: calories },
          protein: { increment: protein },
        },
        create: {
          userId,
          dateKey,
          calories,
          protein,
        },
      });

      return log;
    });
  }

  private normalizeDateKey(dateKey?: string): string {
    const value = dateKey ?? new Date().toISOString().slice(0, 10);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException('dateKey must use YYYY-MM-DD format');
    }

    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
      throw new BadRequestException('dateKey must be a valid calendar date');
    }

    return value;
  }
}
