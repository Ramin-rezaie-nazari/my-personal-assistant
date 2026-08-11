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
        caloriesProgress: calorieGoal > 0 ? this.progress(calories, calorieGoal) : 0,
        protein,
        proteinGoal,
        proteinRemaining: Math.max(proteinGoal - protein, 0),
        proteinProgress: proteinGoal > 0 ? this.progress(protein, proteinGoal) : 0,
        waterMl,
        waterGoalMl,
        waterRemainingMl: Math.max(waterGoalMl - waterMl, 0),
        waterProgress: waterGoalMl > 0 ? this.progress(waterMl, waterGoalMl) : 0,
      },
      meals,
      mealCount: meals.length,
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
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== key) {
      throw new Error('dateKey must be a valid calendar date');
    }

    return key;
  }

  private nextDateKey(key: string): string {
    const next = new Date(`${key}T00:00:00.000Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    return next.toISOString().slice(0, 10);
  }
}
