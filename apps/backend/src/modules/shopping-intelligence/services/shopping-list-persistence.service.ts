import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { HouseholdItemNormalizerService } from './household-item-normalizer.service';

export type ShoppingListMutation = {
  userId: string;
  foodId: string;
  name: string;
  quantity: number;
  unit: string;
  source?: string;
  sourceRecipeId?: string | null;
  priority?: string;
};

@Injectable()
export class ShoppingListPersistenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly normalizer: HouseholdItemNormalizerService,
  ) {}

  list(userId: string, completed = false) {
    return this.prisma.shoppingItem.findMany({
      where: { userId, completed },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async addOrMerge(input: ShoppingListMutation) {
    const normalized = this.normalizer.normalizeQuantity(input.quantity, input.unit);
    if (normalized.quantity <= 0) {
      throw new BadRequestException('Shopping quantity must be positive');
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.shoppingItem.findFirst({
        where: {
          userId: input.userId,
          foodId: input.foodId,
          completed: false,
        },
      });

      if (!existing) {
        const max = await tx.shoppingItem.aggregate({
          where: { userId: input.userId, completed: false },
          _max: { sortOrder: true },
        });
        return tx.shoppingItem.create({
          data: {
            userId: input.userId,
            foodId: input.foodId,
            name: input.name.trim(),
            quantity: normalized.quantity,
            unit: normalized.unit,
            source: input.source ?? 'manual',
            sourceRecipeId: input.sourceRecipeId ?? null,
            priority: input.priority ?? 'normal',
            sortOrder: (max._max.sortOrder ?? -1) + 1,
          },
        });
      }

      if (!this.normalizer.canConvert(existing.unit, normalized.unit)) {
        throw new BadRequestException('Incompatible shopping units');
      }
      const delta = this.normalizer.convert(
        normalized.quantity,
        normalized.unit,
        existing.unit,
      );

      return tx.shoppingItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + delta,
          priority: input.priority ?? existing.priority,
          source: input.source ?? existing.source,
          sourceRecipeId: input.sourceRecipeId ?? existing.sourceRecipeId,
          name: input.name.trim() || existing.name,
        },
      });
    });
  }

  async update(userId: string, itemId: string, patch: Partial<Omit<ShoppingListMutation, 'userId' | 'foodId'>> & { quantity?: number; unit?: string }) {
    const existing = await this.prisma.shoppingItem.findFirst({
      where: { id: itemId, userId },
    });
    if (!existing) throw new NotFoundException('Shopping item not found');

    let quantity = existing.quantity;
    let unit = existing.unit;
    if (patch.quantity !== undefined || patch.unit !== undefined) {
      const normalized = this.normalizer.normalizeQuantity(
        patch.quantity ?? existing.quantity,
        patch.unit ?? existing.unit,
      );
      quantity = this.normalizer.convert(normalized.quantity, normalized.unit, existing.unit);
      unit = existing.unit;
    }

    return this.prisma.shoppingItem.update({
      where: { id: itemId },
      data: {
        quantity,
        unit,
        ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
        ...(patch.source !== undefined ? { source: patch.source } : {}),
        ...(patch.sourceRecipeId !== undefined ? { sourceRecipeId: patch.sourceRecipeId } : {}),
        ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
      },
    });
  }

  async remove(userId: string, itemId: string) {
    const result = await this.prisma.shoppingItem.deleteMany({
      where: { id: itemId, userId },
    });
    if (result.count === 0) throw new NotFoundException('Shopping item not found');
    return { removed: true };
  }

  async setCompleted(userId: string, itemId: string, completed: boolean) {
    const existing = await this.prisma.shoppingItem.findFirst({
      where: { id: itemId, userId },
    });
    if (!existing) throw new NotFoundException('Shopping item not found');

    if (!completed) {
      return this.prisma.shoppingItem.update({
        where: { id: itemId },
        data: { completed: false },
      });
    }

    const duplicateCompleted = await this.prisma.shoppingItem.findFirst({
      where: {
        userId,
        foodId: existing.foodId,
        completed: true,
        id: { not: itemId },
      },
    });

    return this.prisma.$transaction(async (tx) => {
      if (duplicateCompleted) {
        const mergedQuantity = this.normalizer.canConvert(
          duplicateCompleted.unit,
          existing.unit,
        )
          ? duplicateCompleted.quantity +
            this.normalizer.convert(existing.quantity, existing.unit, duplicateCompleted.unit)
          : null;
        if (mergedQuantity === null) {
          throw new BadRequestException('Incompatible shopping units');
        }
        await tx.shoppingItem.update({
          where: { id: duplicateCompleted.id },
          data: { quantity: mergedQuantity },
        });
        return tx.shoppingItem.delete({ where: { id: itemId } });
      }
      return tx.shoppingItem.update({
        where: { id: itemId },
        data: { completed: true },
      });
    });
  }

  async reorder(userId: string, itemId: string, sortOrder: number) {
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      throw new BadRequestException('sortOrder must be a non-negative integer');
    }
    const item = await this.prisma.shoppingItem.findFirst({
      where: { id: itemId, userId },
    });
    if (!item) throw new NotFoundException('Shopping item not found');
    return this.prisma.shoppingItem.update({
      where: { id: itemId },
      data: { sortOrder },
    });
  }
}
