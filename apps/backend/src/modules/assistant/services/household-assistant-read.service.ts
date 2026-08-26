import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { FoodOperatingLoopService } from '../../recipes/services/food-operating-loop.service';

@Injectable()
export class HouseholdAssistantReadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly foodLoop: FoodOperatingLoopService,
  ) {}

  async inspectInventory(userId: string) {
    return this.prisma.inventoryItem.findMany({
      where: { userId },
      include: { food: { select: { id: true, name: true, category: true } } },
      orderBy: [{ essential: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async missingForRecipe(userId: string, recipeId: string, servings: number) {
    const plan = await this.foodLoop.buildPlan(userId, recipeId, servings);
    if (!plan) throw new NotFoundException('Recipe plan not found');
    return {
      recipe: plan.recipe,
      missing: plan.inventory.missing,
      available: plan.inventory.available,
      coveragePercent: plan.inventory.coveragePercent,
    };
  }
}
