import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InventoryService } from '../inventory/inventory.service';
import { PrismaService } from '../../common/database/prisma.service';
import { convertQuantity } from '../../common/units/quantity-conversion';

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
      throw new BadRequestException('Quantity must be positive');

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
    if (existing) {
      const quantity = convertQuantity(item.quantity, item.unit, existing.unit);
      if (quantity === null) {
        throw new BadRequestException(
          `Incompatible shopping units: ${item.unit} cannot be merged into ${existing.unit}`,
        );
      }
      return this.prisma.shoppingItem.update({
        where: { id: existing.id },
        data: {
          quantity: { increment: quantity },
          source: item.source ?? existing.source,
          priority: item.priority ?? existing.priority,
        },
      });
    }

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
      where: { id: recipeId, OR: [{ userId: null }, { userId }] },
      include: { ingredients: true },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');

    const allowed = new Set(recipe.ingredients.map((i) => i.foodId));
    const invalidItem = items.find(
      (i) =>
        !allowed.has(i.foodId) ||
        !Number.isFinite(i.quantity) ||
        i.quantity <= 0 ||
        typeof i.unit !== 'string' ||
        !i.unit.trim(),
    );
    if (invalidItem) {
      throw new BadRequestException(
        'Every shopping item must belong to the recipe and have a positive quantity and unit',
      );
    }
    const valid = items;

    await this.prisma.$transaction(async (tx) => {
      for (const item of valid) {
        const food = await tx.foodItem.findFirst({
          where: { id: item.foodId, OR: [{ userId: null }, { userId }] },
          select: { name: true },
        });
        if (!food) throw new NotFoundException('Food item not found');

        const existing = await tx.shoppingItem.findUnique({
          where: {
            userId_foodId_completed: {
              userId,
              foodId: item.foodId,
              completed: false,
            },
          },
        });

        if (existing) {
          const quantity = convertQuantity(item.quantity, item.unit, existing.unit);
          if (quantity === null) {
            throw new BadRequestException(
              `Incompatible shopping units: ${item.unit} cannot be merged into ${existing.unit}`,
            );
          }
          await tx.shoppingItem.update({
            where: { id: existing.id },
            data: {
              quantity: { increment: quantity },
              source: 'recipe',
              priority: 'high',
            },
          });
        } else {
          await tx.shoppingItem.create({
            data: {
              userId,
              foodId: item.foodId,
              name: food.name,
              quantity: item.quantity,
              unit: item.unit,
              source: 'recipe',
              sourceRecipeId: recipeId,
              priority: 'high',
            },
          });
        }
      }
    });

    return { recipeId, added: valid.length };
  }

  async complete(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.shoppingItem.findFirst({
        where: { id, userId, completed: false },
      });
      if (!item) return { count: 0, inventorySynced: false };

      const completed = await tx.shoppingItem.updateMany({
        where: { id, userId, completed: false },
        data: { completed: true },
      });
      if (!completed.count) return { count: 0, inventorySynced: false };

      const existing = await tx.inventoryItem.findUnique({
        where: { userId_foodId: { userId, foodId: item.foodId } },
      });

      if (existing) {
        const quantity = convertQuantity(item.quantity, item.unit, existing.unit);
        if (quantity === null) {
          throw new BadRequestException(
            `Incompatible inventory units: ${item.unit} cannot be added to ${existing.unit}`,
          );
        }
        await tx.inventoryItem.update({
          where: { id: existing.id },
          data: { quantity: { increment: quantity } },
        });
      } else {
        await tx.inventoryItem.create({
          data: {
            userId,
            foodId: item.foodId,
            quantity: item.quantity,
            unit: item.unit,
          },
        });
      }

      return { count: 1, inventorySynced: true };
    });
  }

  private priority(u: SmartShoppingItem['urgency']) {
    return u === 'critical' ? 3 : u === 'soon' ? 2 : u === 'normal' ? 1 : 0;
  }
}
