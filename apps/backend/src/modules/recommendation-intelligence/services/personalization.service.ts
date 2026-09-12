import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class PersonalizationService {
  constructor(private readonly prisma: PrismaService) {}

  async buildContext(userId: string) {
    const [profile, health, nutrition, meals] = await Promise.all([
      this.prisma.userProfile.findUnique({ where: { userId } }),
      this.prisma.healthProfile.findUnique({ where: { userId } }),
      this.prisma.nutritionProfile.findUnique({ where: { userId } }),
      this.prisma.meal.findMany({ where: { userId }, orderBy: { eatenAt: 'desc' }, take: 20, select: { name: true, type: true, calories: true, protein: true } }),
    ]);
    return {
      goal: profile?.primaryGoal ?? null,
      profile: { gender: profile?.gender ?? health?.gender ?? null, heightCm: profile?.heightCm ?? health?.heightCm ?? null, weightKg: profile?.weightKg ?? health?.weightKg ?? null },
      nutrition: { caloriesGoal: nutrition?.dailyCaloriesGoal ?? null, proteinGoal: nutrition?.proteinGoalGrams ?? null, waterGoalMl: nutrition?.waterGoalMl ?? null, dietType: nutrition?.dietType ?? null },
      recentMeals: meals,
    };
  }
}
