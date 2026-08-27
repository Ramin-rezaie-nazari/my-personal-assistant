import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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

type ShoppingInput = {
  foodId: string;
  name?: string;
  quantity: number;
  unit: string;
  source?: string;
  priority?: string;
  sourceRecipeId?: string;
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
          (i.urgency === 'critical' || i.urgency === 'soon' || i.recommendedQuantity > 0) &&
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
      where: { userId },
      include: { food: true },
      orderBy: [{ completed: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async addToBasket(userId: string, item: ShoppingInput) {
    if (item.quantity <= 0) throw new BadRequestException('Quantity must be positive');
    const food = await this.prisma.foodItem.findUnique({ where: { id: item.foodId } });
    if (!food) throw new NotFoundException('Food item not found');
    const existing = await this.prisma.shoppingItem.findFirst({
      where: { userId, foodId: item.foodId, completed: false },
    });
    if (existing) {
      const merged = mergeQuantity(existing.quantity, existing.unit, item.quantity, item.unit);
      if (!merged) {
        return this.prisma.shoppingItem.create({
          data: {
            userId,
            foodId: item.foodId,
            name: food.name,
            quantity: item.quantity,
            unit: item.unit,
            source: item.source ?? 'manual',
            sourceRecipeId: item.sourceRecipeId,
            priority: item.priority ?? existing.priority,
            sortOrder: existing.sortOrder + 1,
          },
        });
      }
      return this.prisma.shoppingItem.update({
        where: { id: existing.id },
        data: {
          quantity: merged.quantity,
          unit: merged.unit,
          source: item.source ?? existing.source,
          sourceRecipeId: item.sourceRecipeId ?? existing.sourceRecipeId,
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
        sourceRecipeId: item.sourceRecipeId,
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
    const valid = items.filter((i) => allowed.has(i.foodId) && i.quantity > 0);
    for (const item of valid) {
      await this.addToBasket(userId, {
        ...item,
        source: 'recipe',
        sourceRecipeId: recipeId,
        priority: 'high',
      });
    }
    return { recipeId, added: valid.length };
  }

  async addRecipesMissing(
    userId: string,
    recipes: Array<{ recipeId: string; items: Array<{ foodId: string; quantity: number; unit: string }> }>,
  ) {
    const added: Array<{ recipeId: string; itemCount: number }> = [];
    for (const recipe of recipes) {
      const result = await this.addRecipeMissing(userId, recipe.recipeId, recipe.items);
      added.push({ recipeId: result.recipeId, itemCount: result.added });
    }
    return { recipes: added, totalAdded: added.reduce((sum, item) => sum + item.itemCount, 0) };
  }

  async complete(userId: string, id: string) {
    return this.prisma.shoppingItem.updateMany({
      where: { id, userId, completed: false },
      data: { completed: true },
    });
  }

  async reopen(userId: string, id: string) {
    return this.prisma.shoppingItem.updateMany({
      where: { id, userId, completed: true },
      data: { completed: false },
    });
  }

  async remove(userId: string, id: string) {
    const result = await this.prisma.shoppingItem.deleteMany({ where: { id, userId } });
    if (result.count === 0) throw new NotFoundException('Shopping item not found');
    return { deleted: true };
  }

  async reorder(userId: string, ids: string[]) {
    const existing = await this.prisma.shoppingItem.findMany({ where: { userId, id: { in: ids } } });
    if (existing.length !== ids.length) throw new BadRequestException('One or more shopping items do not belong to the user');
    await this.prisma.$transaction(
      ids.map((id, index) => this.prisma.shoppingItem.update({ where: { id }, data: { sortOrder: index } })),
    );
    return this.listBasket(userId);
  }

  private priority(u: SmartShoppingItem['urgency']) {
    return u === 'critical' ? 3 : u === 'soon' ? 2 : u === 'normal' ? 1 : 0;
  }
}

function mergeQuantity(left: number, leftUnit: string, right: number, rightUnit: string) {
  const a = normalize(leftUnit, left);
  const b = normalize(rightUnit, right);
  if (!a || !b || a.kind !== b.kind) return null;
  const value = a.base + b.base;
  return { quantity: denormalize(value, a.kind, leftUnit), unit: leftUnit };
}

function normalize(unit: string, quantity: number): { kind: 'mass' | 'volume' | 'count'; base: number } | null {
  const u = unit.trim().toLowerCase();
  if (['g', 'gr', 'gram', 'grams', 'گرم'].includes(u)) return { kind: 'mass', base: quantity };
  if (['kg', 'kilogram', 'kilograms', 'کیلو'].includes(u)) return { kind: 'mass', base: quantity * 1000 };
  if (['mg', 'milligram', 'milligrams'].includes(u)) return { kind: 'mass', base: quantity / 1000 };
  if (['ml', 'milliliter', 'milliliters'].includes(u)) return { kind: 'volume', base: quantity };
  if (['l', 'liter', 'liters'].includes(u)) return { kind: 'volume', base: quantity * 1000 };
  if (['piece', 'pieces', 'pcs', 'count', 'عدد'].includes(u)) return { kind: 'count', base: quantity };
  return null;
}

function denormalize(base: number, kind: 'mass' | 'volume' | 'count', unit: string) {
  const u = unit.trim().toLowerCase();
  if (kind === 'mass' && ['kg', 'kilogram', 'kilograms', 'کیلو'].includes(u)) return Number((base / 1000).toFixed(3));
  if (kind === 'mass' && ['mg', 'milligram', 'milligrams'].includes(u)) return Number((base * 1000).toFixed(2));
  if (kind === 'volume' && ['l', 'liter', 'liters'].includes(u)) return Number((base / 1000).toFixed(3));
  return Number(base.toFixed(3));
}
