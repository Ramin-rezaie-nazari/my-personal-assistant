import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class NutritionService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.prisma.nutritionProfile.findUnique({
      where: { userId },
    });
  }

  async updateProfile(
    userId: string,
    data: {
      dailyCaloriesGoal?: number;
      proteinGoalGrams?: number;
      waterGoalMl?: number;
      dietType?: string;
    },
  ) {
    return this.prisma.nutritionProfile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });
  }
}
