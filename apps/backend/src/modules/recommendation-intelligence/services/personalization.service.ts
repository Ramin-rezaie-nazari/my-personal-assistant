import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

export type FoodDecisionContext = {
  dietaryPreferences: string[];
  allergySignals: string[];
  dislikedIngredients: string[];
  recentMealNames: string[];
  targetCaloriesPerServing?: number;
  targetProteinPerServing?: number;
  countryCode: string;
};

@Injectable()
export class PersonalizationService {
  constructor(private readonly prisma: PrismaService) {}

  async getFoodDecisionContext(userId: string, overrides: {
    countryCode?: string;
    dietaryPreferences?: string[];
    allergySignals?: string[];
    dislikedIngredients?: string[];
    maxCalories?: number;
    minProteinGrams?: number;
  }): Promise<FoodDecisionContext> {
    const [profile, health, nutrition, settings, recentMeals] = await Promise.all([
      this.prisma.userPreference.findUnique({ where: { userId }, select: { theme: true } }),
      this.prisma.healthProfile.findUnique({ where: { userId }, select: { primaryGoal: true, activityLevel: true, targetWeightKg: true } }).catch(() => null),
      this.prisma.nutritionProfile.findUnique({ where: { userId }, select: { dietType: true, dailyCaloriesGoal: true, proteinGoalGrams: true } }),
      this.prisma.userSettings.findUnique({ where: { userId }, select: { language: true, timezone: true } }),
      this.prisma.meal.findMany({ where: { userId }, orderBy: { eatenAt: 'desc' }, take: 12, select: { name: true } }),
    ]);

    const inferredDiet = nutrition?.dietType ? [nutrition.dietType] : [];
    const goal = String(health?.primaryGoal || '').toLowerCase();
    const calorieTarget = overrides.maxCalories ?? (nutrition?.dailyCaloriesGoal ? Math.round(nutrition.dailyCaloriesGoal * 0.45) : undefined);
    const proteinTarget = overrides.minProteinGrams ?? (nutrition?.proteinGoalGrams ? Math.round(nutrition.proteinGoalGrams * 0.30) : undefined);

    return {
      dietaryPreferences: unique([...inferredDiet, ...(overrides.dietaryPreferences ?? [])]),
      allergySignals: unique(overrides.allergySignals ?? []),
      dislikedIngredients: unique(overrides.dislikedIngredients ?? []),
      recentMealNames: recentMeals.map((meal) => meal.name).filter(Boolean),
      targetCaloriesPerServing: calorieTarget,
      targetProteinPerServing: proteinTarget,
      countryCode: String(overrides.countryCode || '').trim().toUpperCase(),
    };
  }

  async personalize(userId: string, overrides: Parameters<PersonalizationService['getFoodDecisionContext']>[1] = {}) {
    return this.getFoodDecisionContext(userId, overrides);
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))];
}
