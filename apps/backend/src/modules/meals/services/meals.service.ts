import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class MealsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.meal.findMany({
      where: { userId },
      include: { items: { include: { food: true } } },
      orderBy: { eatenAt: 'desc' },
    });
  }

  async create(
    userId: string,
    data: {
      name: string;
      type: string;
      eatenAt: string;
      dateKey?: string;
      items: Array<{ foodId: string; quantity: number }>;
    },
  ) {
    this.assertText(data.name, 'name');
    this.assertText(data.type, 'type');
    if (!Number.isFinite(Date.parse(data.eatenAt))) {
      throw new BadRequestException('eatenAt must be a valid date-time');
    }
    if (data.items.length === 0) {
      throw new BadRequestException('A meal must contain at least one food item');
    }
    for (const item of data.items) {
      this.assertText(item.foodId, 'foodId');
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        throw new BadRequestException('quantity must be a finite number greater than zero');
      }
    }

    const dateKey = this.normalizeDateKey(data.dateKey ?? data.eatenAt.slice(0, 10));
    const foodIds = [...new Set(data.items.map((item) => item.foodId))];

    return this.prisma.$transaction(async (tx) => {
      const foods = await tx.foodItem.findMany({
        where: {
          id: { in: foodIds },
          OR: [{ userId: null }, { userId }],
        },
      });

      if (foods.length !== foodIds.length) {
        throw new NotFoundException('One or more food items were not found');
      }

      const foodById = new Map(foods.map((food) => [food.id, food]));
      const items = data.items.map((item) => {
        const food = foodById.get(item.foodId)!;
        return {
          foodId: food.id,
          quantity: item.quantity,
          calories: Math.round(food.calories * item.quantity),
          protein: food.protein * item.quantity,
          carbs: food.carbs * item.quantity,
          fat: food.fat * item.quantity,
        };
      });

      const totals = items.reduce(
        (sum, item) => ({
          calories: sum.calories + item.calories,
          protein: sum.protein + item.protein,
          carbs: sum.carbs + item.carbs,
          fat: sum.fat + item.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      );

      const meal = await tx.meal.create({
        data: {
          userId,
          name: data.name,
          type: data.type,
          eatenAt: new Date(data.eatenAt),
          ...totals,
          items: { create: items },
        },
        include: { items: { include: { food: true } } },
      });

      await tx.dailyLog.upsert({
        where: { userId_dateKey: { userId, dateKey } },
        update: {
          calories: { increment: totals.calories },
          protein: { increment: totals.protein },
        },
        create: {
          userId,
          dateKey,
          calories: totals.calories,
          protein: totals.protein,
        },
      });

      return meal;
    });
  }

  private assertText(value: string, field: string) {
    if (!value || !value.trim()) {
      throw new BadRequestException(`${field} must not be empty`);
    }
  }

  private normalizeDateKey(value: string): string {
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
