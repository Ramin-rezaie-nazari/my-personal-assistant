import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { DecisionActionAdapterService } from '../../personal-brain/services/decision-action-adapter.service';
import { DecisionCandidate } from '../../personal-brain/services/unified-decision-engine.service';

const FOOD_NAMES: Record<string, string[]> = {
  milk: ['milk', 'شیر'],
  eggs: ['eggs', 'egg', 'تخم مرغ', 'تخم‌مرغ'],
  chicken: ['chicken', 'مرغ'],
  rice: ['rice', 'برنج'],
  yogurt: ['yogurt', 'ماست'],
  bread: ['bread', 'نان'],
  banana: ['banana', 'موز'],
};

@Injectable()
export class LocalBasketActionAdapter implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adapters: DecisionActionAdapterService,
  ) {}

  onModuleInit() {
    this.adapters.register({
      supports: (candidate) =>
        candidate.action === 'add_to_basket' ||
        candidate.action === 'remove_from_basket',
      execute: (candidate, context) => this.execute(candidate, context),
    });
  }

  private async execute(
    candidate: DecisionCandidate,
    context: Record<string, unknown>,
  ) {
    const understanding = context.localUnderstanding as
      { entities?: Record<string, unknown> } | undefined;
    const food =
      typeof understanding?.entities?.food === 'string'
        ? understanding.entities.food
        : undefined;
    const quantity =
      typeof understanding?.entities?.quantity === 'number'
        ? understanding.entities.quantity
        : 1;
    if (!food) throw new Error('food_entity_missing');

    const aliases = FOOD_NAMES[food] ?? [food];
    const foodItem = await this.prisma.foodItem.findFirst({
      where: {
        OR: aliases.map((name) => ({
          name: { equals: name, mode: 'insensitive' as const },
        })),
      },
    });
    if (!foodItem) throw new Error(`food_not_found:${food}`);

    if (candidate.action === 'remove_from_basket') {
      const result = await this.prisma.shoppingItem.updateMany({
        where: {
          userId: context.userId as string,
          foodId: foodItem.id,
          completed: false,
        },
        data: { completed: true },
      });
      return { changed: result.count, foodId: foodItem.id, food };
    }

    const existing = await this.prisma.shoppingItem.findFirst({
      where: {
        userId: context.userId as string,
        foodId: foodItem.id,
        completed: false,
      },
    });
    const item = existing
      ? await this.prisma.shoppingItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + quantity },
        })
      : await this.prisma.shoppingItem.create({
          data: {
            userId: context.userId as string,
            foodId: foodItem.id,
            name: foodItem.name,
            quantity,
            unit: 'unit',
            source: 'assistant',
            priority: 'normal',
          },
        });
    return { id: item.id, foodId: foodItem.id, food, quantity: item.quantity };
  }
}
