import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class RecipeLibraryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, input: {
    page?: number;
    pageSize?: number;
    q?: string;
    verified?: boolean;
  }) {
    const page = clampInt(input.page ?? 1, 1, 100000);
    const pageSize = clampInt(input.pageSize ?? 24, 1, 50);
    const q = input.q?.trim();
    const where = {
      AND: [
        { OR: [{ userId: null }, { userId }] },
        q ? { name: { contains: q, mode: 'insensitive' as const } } : {},
        input.verified === undefined ? {} : { verified: input.verified },
      ],
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.recipe.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          imageSource: true,
          servings: true,
          calories: true,
          protein: true,
          carbs: true,
          fat: true,
          verified: true,
          userId: true,
        },
        orderBy: [{ verified: 'desc' }, { name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.recipe.count({ where }),
    ]);
    return { items, total, page, pageSize, hasNextPage: page * pageSize < total };
  }
}

function clampInt(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? Math.round(value) : min));
}
