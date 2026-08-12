import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

import { BrainNutritionTargets } from '../types/brain-nutrition-targets.types';

@Injectable()
export class BrainNutritionTargetsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTargets(userId: string): Promise<BrainNutritionTargets> {
    const profile = await this.prisma.nutritionProfile.findUnique({
      where: { userId },
    });

    const dailyCaloriesGoal = profile?.dailyCaloriesGoal ?? undefined;
    const proteinGoalGrams = profile?.proteinGoalGrams ?? undefined;
    const waterGoalMl = profile?.waterGoalMl ?? undefined;

    return {
      hasTargets: Boolean(
        dailyCaloriesGoal ?? proteinGoalGrams ?? waterGoalMl,
      ),
      dailyCaloriesGoal,
      proteinGoalGrams,
      waterGoalMl,
    };
  }
}
