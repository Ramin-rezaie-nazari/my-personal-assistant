import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class NutritionService {
  constructor(private readonly prisma: PrismaService) {}

  async getLogs(userId: string) {
    return this.prisma.nutritionLog.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createLog(
    userId: string,
    data: {
      mealType: string;
      title: string;
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    },
  ) {
    return this.prisma.nutritionLog.create({
      data: {
        userId,
        ...data,
      },
    });
  }
}
