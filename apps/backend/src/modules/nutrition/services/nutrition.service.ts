import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

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
