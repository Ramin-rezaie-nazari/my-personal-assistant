import { Injectable, OnModuleInit } from '@nestjs/common';
import { DecisionActionAdapterService } from '../../personal-brain/services/decision-action-adapter.service';
import { DecisionCandidate } from '../../personal-brain/services/unified-decision-engine.service';
import { ShoppingService } from '../../shopping/shopping.service';
import { InventoryService } from '../../inventory/inventory.service';
import { HouseholdItemResolutionService } from '../../shopping-intelligence/services/household-item-resolution.service';

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
    private readonly adapters: DecisionActionAdapterService,
    private readonly shopping: ShoppingService,
    private readonly inventory: InventoryService,
    private readonly resolver: HouseholdItemResolutionService,
  ) {}

  onModuleInit() {
    this.adapters.register({
      supports: (candidate) =>
        candidate.action === 'add_to_basket' ||
        candidate.action === 'remove_from_basket' ||
        candidate.action === 'consume_inventory' ||
        candidate.action === 'purchase_inventory',
      execute: (candidate, context) => this.execute(candidate, context),
    });
  }

  private async execute(
    candidate: DecisionCandidate,
    context: Record<string, unknown>,
  ) {
    const understanding = context.localUnderstanding as { entities?: Record<string, unknown> } | undefined;
    const food = typeof understanding?.entities?.food === 'string' ? understanding.entities.food : undefined;
    const quantity = typeof understanding?.entities?.quantity === 'number' ? understanding.entities.quantity : 1;
    if (!food) throw new Error('food_entity_missing');

    const userId = context.userId as string;
    const aliases = FOOD_NAMES[food] ?? [food];
    let resolved: { id: string; name: string; category: string } | null = null;
    let ambiguous = false;
    for (const alias of aliases) {
      const result = await this.resolver.resolve(userId, alias);
      if (result.status === 'ambiguous') {
        ambiguous = true;
        break;
      }
      if (result.status === 'resolved') {
        resolved = result.item;
        break;
      }
    }
    if (ambiguous) throw new Error(`food_ambiguous:${food}`);
    if (!resolved) throw new Error(`food_not_found:${food}`);

    if (candidate.action === 'add_to_basket') {
      const item = await this.shopping.addToBasket(userId, {
        foodId: resolved.id,
        quantity,
        unit: 'piece',
        source: 'assistant',
        priority: 'normal',
      });
      return { id: item.id, foodId: resolved.id, food, quantity: item.quantity };
    }

    if (candidate.action === 'remove_from_basket') {
      const result = await this.shopping.listBasket(userId);
      const item = result.find((entry) => entry.foodId === resolved.id && !entry.completed);
      if (!item) return { changed: 0, foodId: resolved.id, food };
      await this.shopping.remove(userId, item.id);
      return { changed: 1, foodId: resolved.id, food };
    }

    const inventory = await this.inventory.list(userId);
    const item = inventory.find((entry) => entry.foodId === resolved.id);
    if (!item) throw new Error(`inventory_item_not_found:${food}`);

    if (candidate.action === 'consume_inventory') {
      const updated = await this.inventory.consume(userId, item.id, quantity);
      return { changed: true, foodId: resolved.id, food, quantity: updated.quantity };
    }

    const updated = await this.inventory.purchase(userId, item.id, quantity);
    return { changed: true, foodId: resolved.id, food, quantity: updated.quantity };
  }
}
