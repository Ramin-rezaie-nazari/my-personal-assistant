import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class FoodsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.foodItem.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async create(data: {
    name: string;
    category: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    imageUrl?: string;
    imageSource?: string;
    verified?: boolean;
  }) {
    return this.prisma.foodItem.create({
      data,
    });
  }
}
