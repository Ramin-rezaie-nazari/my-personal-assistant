import { Injectable, NotFoundException } from '@nestjs/common';
import { InventoryService } from '../inventory/inventory.service';
import { PrismaService } from '../../../common/database/prisma.service';

export type SmartShoppingItem = {
  foodId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  recommendedQuantity: number;
  urgency: 'critical' | 'soon' | 'normal' | 'none';
  reason: string;
  essential: boolean;
};

@Injectable()
export class ShoppingService {
  constructor(private readonly inventory: InventoryService, private readonly prisma: PrismaService) {}

  async smartList(userId: string): Promise<SmartShoppingItem[]> {
    const inventory = await this.inventory.list(userId);
    return inventory
      .filter((item) => item.urgency === 'critical' || item.urgency === 'soon' || item.recommendedQuantity > 0)
      .map((item) => ({ foodId: item.foodId, name: item.food.name, category: item.food.category, quantity: item.quantity, unit: item.unit, recommendedQuantity: item.recommendedQuantity, urgency: item.urgency, reason: item.reason, essential: item.essential }))
      .sort((a, b) => Number(b.essential) - Number(a.essential) || this.priority(b.urgency) - this.priority(a.urgency) || a.name.localeCompare(b.name));
  }

  async addRecipeMissing(userId: string, recipeId: string, items: Array<{ foodId: string; quantity: number; unit: string }>) {
    const recipe = await this.prisma.recipe.findUnique({ where: { id: recipeId }, include: { ingredients: true } });
    if (!recipe) throw new NotFoundException('Recipe not found');
    const ingredientIds = new Set(recipe.ingredients.map((item) => item.foodId));
    const validItems = items.filter((item) => ingredientIds.has(item.foodId) && item.quantity > 0);
    return { recipeId, added: validItems.length, items: validItems };
  }

  private priority(urgency: SmartShoppingItem['urgency']) {
    return urgency === 'critical' ? 3 : urgency === 'soon' ? 2 : urgency === 'normal' ? 1 : 0;
  }
}
