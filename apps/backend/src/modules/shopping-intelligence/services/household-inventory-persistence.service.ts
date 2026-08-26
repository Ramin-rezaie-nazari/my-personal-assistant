import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { HouseholdItemNormalizerService } from './household-item-normalizer.service';

export type InventoryMutationType =
  | 'add'
  | 'consume'
  | 'adjust'
  | 'waste'
  | 'purchase';

export type PersistInventoryMutation = {
  userId: string;
  foodId: string;
  type: InventoryMutationType;
  quantity: number;
  unit: string;
  source?: string;
  idempotencyKey?: string;
  expiresAt?: Date | null;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
};

@Injectable()
export class HouseholdInventoryPersistenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly normalizer: HouseholdItemNormalizerService,
  ) {}

  async mutate(input: PersistInventoryMutation) {
    const normalized = this.normalizer.normalizeQuantity(input.quantity, input.unit);
    if (normalized.quantity <= 0) {
      throw new BadRequestException('Inventory mutation quantity must be positive');
    }

    return this.prisma.$transaction(async (tx) => {
      if (input.idempotencyKey) {
        const existingEvent = await tx.inventoryEvent.findUnique({
          where: {
            userId_idempotencyKey: {
              userId: input.userId,
              idempotencyKey: input.idempotencyKey,
            },
          },
        });
        if (existingEvent) {
          return tx.inventoryItem.findUnique({
            where: {
              userId_foodId: {
                userId: input.userId,
                foodId: input.foodId,
              },
            },
          });
        }
      }

      const current = await tx.inventoryItem.findUnique({
        where: {
          userId_foodId: {
            userId: input.userId,
            foodId: input.foodId,
          },
        },
      });

      const nextQuantity = this.computeNextQuantity(
        input.type,
        current?.quantity ?? 0,
        current?.unit ?? normalized.unit,
        normalized.quantity,
        normalized.unit,
      );

      if (nextQuantity < 0) {
        throw new BadRequestException('Insufficient inventory');
      }

      const nextUnit = current?.unit ?? normalized.unit;
      const nextExpiresAt = this.earlierExpiry(current?.expiresAt, input.expiresAt);
      const inventory = await tx.inventoryItem.upsert({
        where: {
          userId_foodId: {
            userId: input.userId,
            foodId: input.foodId,
          },
        },
        create: {
          userId: input.userId,
          foodId: input.foodId,
          quantity: nextQuantity,
          unit: nextUnit,
          expiresAt: nextExpiresAt,
        },
        update: {
          quantity: nextQuantity,
          unit: nextUnit,
          ...(nextExpiresAt !== undefined ? { expiresAt: nextExpiresAt } : {}),
        },
      });

      await tx.inventoryEvent.create({
        data: {
          userId: input.userId,
          foodId: input.foodId,
          type: input.type,
          quantity: normalized.quantity,
          unit: normalized.unit,
          source: input.source ?? 'manual',
          idempotencyKey: input.idempotencyKey,
          occurredAt: input.occurredAt ?? new Date(),
          metadata: input.metadata,
        },
      });

      return inventory;
    });
  }

  history(userId: string, foodId: string, limit = 100) {
    const boundedLimit = Math.max(1, Math.min(500, Math.floor(limit)));
    return this.prisma.inventoryEvent.findMany({
      where: { userId, foodId },
      orderBy: { occurredAt: 'desc' },
      take: boundedLimit,
    });
  }

  private computeNextQuantity(
    type: InventoryMutationType,
    currentQuantity: number,
    currentUnit: string,
    incomingQuantity: number,
    incomingUnit: string,
  ): number {
    const converted = this.normalizer.convert(
      incomingQuantity,
      incomingUnit,
      currentUnit,
    );

    switch (type) {
      case 'add':
      case 'purchase':
        return currentQuantity + converted;
      case 'consume':
      case 'waste':
        return currentQuantity - converted;
      case 'adjust':
        return converted;
      default: {
        const exhaustive: never = type;
        return exhaustive;
      }
    }
  }

  private earlierExpiry(
    a?: Date | null,
    b?: Date | null,
  ): Date | null | undefined {
    if (!a) return b;
    if (!b) return a;
    return a.getTime() <= b.getTime() ? a : b;
  }
}
