import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class FoodsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query?: string) {
    return this.prisma.foodItem.findMany({
      where: {
        AND: [
          { OR: [{ userId: null }, { userId }] },
          query
            ? {
                OR: [
                  { name: { contains: query, mode: 'insensitive' } },
                  { category: { contains: query, mode: 'insensitive' } },
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
    return this.prisma.foodItem.create({
      data: {
        userId,
        ...data,
        verified: false,
      },
    });
  }
}
