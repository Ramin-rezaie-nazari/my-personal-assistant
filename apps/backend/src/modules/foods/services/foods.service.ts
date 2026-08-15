import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class FoodsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query?: string) {
    const normalizedQuery = query?.trim();

    return this.prisma.foodItem.findMany({
      where: {
        AND: [
          { OR: [{ userId: null }, { userId }] },
          normalizedQuery
            ? {
                OR: [
                  { name: { contains: normalizedQuery, mode: 'insensitive' } },
                  { category: { contains: normalizedQuery, mode: 'insensitive' } },
                ],
              }
            : {},
        ],
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(
    userId: string,
    data: {
      name: string;
      category: string;
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      imageUrl?: string;
      imageSource?: string;
    },
  ) {
    this.assertText(data.name, 'name');
    this.assertText(data.category, 'category');
    this.assertNonNegative(data.calories, 'calories');
    this.assertNonNegative(data.protein, 'protein');
    this.assertNonNegative(data.carbs, 'carbs');
    this.assertNonNegative(data.fat, 'fat');

    return this.prisma.foodItem.create({
      data: {
        userId,
        ...data,
        verified: false,
      },
    });
  }

  private assertText(value: string, field: string) {
    if (!value || !value.trim()) {
      throw new BadRequestException(`${field} must not be empty`);
    }
  }

  private assertNonNegative(value: number | undefined, field: string) {
    if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
      throw new BadRequestException(`${field} must be a finite non-negative number`);
    }
  }
}
