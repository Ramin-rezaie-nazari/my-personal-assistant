import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

export type FoodPersonalizationContext = {
  primaryGoal: string | null;
  nutritionGoal: string | null;
  dietType: string | null;
  dailyCaloriesGoal: number | null;
  proteinGoalGrams: number | null;
  recentMealNames: string[];
  allergyTerms: string[];
  dietaryTerms: string[];
};

@Injectable()
export class PersonalizationService {
  constructor(private readonly prisma: PrismaService) {}

  async buildFoodContext(userId: string): Promise<FoodPersonalizationContext> {
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const [profile, assistantProfile, nutritionProfile, meals, facts] =
      await Promise.all([
        this.prisma.userProfile.findUnique({
          where: { userId },
          select: { primaryGoal: true },
        }),
        this.prisma.assistantProfile.findUnique({
          where: { userId },
          select: { nutritionGoal: true },
        }),
        this.prisma.nutritionProfile.findUnique({
          where: { userId },
          select: {
            dietType: true,
            dailyCaloriesGoal: true,
            proteinGoalGrams: true,
          },
        }),
        this.prisma.meal.findMany({
          where: { userId, eatenAt: { gte: since } },
          orderBy: { eatenAt: 'desc' },
          take: 12,
          select: { name: true },
        }),
        this.prisma.userFact.findMany({
          where: {
            userId,
            category: { in: ['allergy', 'dietary'] },
          },
          select: { category: true, value: true },
        }),
      ]);

    return {
      primaryGoal: profile?.primaryGoal ?? null,
      nutritionGoal: assistantProfile?.nutritionGoal ?? null,
      dietType: nutritionProfile?.dietType ?? null,
      dailyCaloriesGoal: nutritionProfile?.dailyCaloriesGoal ?? null,
      proteinGoalGrams: nutritionProfile?.proteinGoalGrams ?? null,
      recentMealNames: meals.map((meal) => meal.name),
      allergyTerms: facts
        .filter((fact) => fact.category === 'allergy')
        .flatMap((fact) => fact.value.split(/[,\n]/g))
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
      dietaryTerms: facts
        .filter((fact) => fact.category === 'dietary')
        .flatMap((fact) => fact.value.split(/[,\n]/g))
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    };
  }
}
