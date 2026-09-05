import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

export type FoodPersonalizationContext = {
  calorieLimit?: number;
  proteinFloor?: number;
  dietType?: string | null;
  primaryGoal?: string | null;
  recentMealTitles: string[];
};

@Injectable()
export class PersonalizationService {
  constructor(private readonly prisma: PrismaService) {}

  async buildFoodContext(userId: string): Promise<FoodPersonalizationContext> {
    const [profile, nutritionProfile, recentMeals] = await Promise.all([
      this.prisma.userProfile.findUnique({
        where: { userId },
        select: { primaryGoal: true },
      }),
      this.prisma.nutritionProfile.findUnique({
        where: { userId },
        select: { dailyCaloriesGoal: true, proteinGoalGrams: true, dietType: true },
      }),
      this.prisma.nutritionLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: { title: true },
      }),
    ]);

    return {
      calorieLimit: nutritionProfile?.dailyCaloriesGoal
        ? Math.round(nutritionProfile.dailyCaloriesGoal * 0.45)
        : undefined,
      proteinFloor: nutritionProfile?.proteinGoalGrams
        ? nutritionProfile.proteinGoalGrams * 0.3
        : undefined,
      dietType: nutritionProfile?.dietType ?? null,
      primaryGoal: profile?.primaryGoal ?? null,
      recentMealTitles: recentMeals.map((meal) => meal.title).filter(Boolean),
    };
  }
}
