import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class MealsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.meal.findMany({
      where: {
        userId,
      },
      include: {
        items: true,
      },
      orderBy: {
        eatenAt: 'desc',
      },
    });
  }

  async create(
    userId: string,
    data: {
      name: string;
      type: string;
      eatenAt: string;
    },
  ) {
    return this.prisma.meal.create({
      data: {
        userId,
        name: data.name,
        type: data.type,
        eatenAt: new Date(data.eatenAt),
      },
    });
  }
}
