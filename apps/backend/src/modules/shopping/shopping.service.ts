import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InventoryService } from '../inventory/inventory.service';
import { PrismaService } from '../../common/database/prisma.service';
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
  constructor(
    private readonly inventory: InventoryService,
    private readonly prisma: PrismaService,
  ) {}
  async smartList(userId: string): Promise<SmartShoppingItem[]> {
    const inventory = await this.inventory.list(userId);
    return inventory
      .filter(
        (i) =>
          (i.urgency === 'critical' ||
            i.urgency === 'soon' ||
            i.recommendedQuantity > 0) &&
          Boolean(i.food) &&
          Boolean(i.foodId),
      )
      .map((i) => ({
        foodId: i.foodId!,
        name: i.food!.name,
        category: i.food!.category,
        quantity: i.quantity,
        unit: i.unit,
        recommendedQuantity: i.recommendedQuantity,
        urgency: i.urgency,
        reason: i.reason,
        essential: Boolean(i.essential),
      }))
      .sort(
        (a, b) =>
          Number(b.essential) - Number(a.essential) ||
          this.priority(b.urgency) - this.priority(a.urgency) ||
          a.name.localeCompare(b.name),
      );
  }
  async listBasket(userId: string) {
    return this.prisma.shoppingItem.findMany({
      where: { userId, completed: false },
      include: { food: true },
      orderBy: [
        { completed: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }
  async addToBasket(
    userId: string,
    item: {
      foodId: string;
      name?: string;
      quantity: number;
      unit: string;
      source?: string;
      priority?: string;
    },
  ) {
    if (!Number.isFinite(item.quantity) || item.quantity <= 0)
      throw new BadRequestException('Quantity must be a positive finite number');
    const food = await this.prisma.foodItem.findFirst({
      where: {
        id: item.foodId,
        OR: [{ userId: null }, { userId }],
      },
    });
    if (!food) throw new NotFoundException('Food item not found');
    const existing = await this.prisma.shoppingItem.findFirst({
      where: { userId, foodId: item.foodId, completed: false },
    });
    if (existing)
      return this.prisma.shoppingItem.update({
        where: { id: existing.id },
        data: {
          quantity: { increment: item.quantity },
          source: item.source ?? existing.source,
          priority: item.priority ?? existing.priority,
        },
      });
    return this.prisma.shoppingItem.create({
      data: {
        userId,
        foodId: item.foodId,
        name: food.name,
        quantity: item.quantity,
        unit: item.unit,
        source: item.source ?? 'manual',
        priority: item.priority ?? 'normal',
      },
    });
  }
  async addRecipeMissing(
    userId: string,
    recipeId: string,
    items: Array<{ foodId: string; quantity: number; unit: string }>,
  ) {
    const recipe = await this.prisma.recipe.findFirst({
      where: {
        id: recipeId,
        OR: [{ userId: null }, { userId }],
      },
      include: { ingredients: true },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');
    const allowed = new Set(recipe.ingredients.map((i) => i.foodId));
    const valid = items.filter((i) => allowed.has(i.foodId) && i.quantity > 0);
    for (const item of valid)
      await this.addToBasket(userId, {
        ...item,
        source: 'recipe',
        priority: 'high',
      });
    return { recipeId, added: valid.length };
  }
  async complete(userId: string, id: string) {
    return this.prisma.shoppingItem.updateMany({
      where: { id, userId, completed: false },
      data: { completed: true },
    });
  }
  private priority(u: SmartShoppingItem['urgency']) {
    return u === 'critical' ? 3 : u === 'soon' ? 2 : u === 'normal' ? 1 : 0;
  }
}
