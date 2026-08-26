import { Injectable } from '@nestjs/common';
import {
  HouseholdShoppingConsolidatorService,
  InventoryAvailability,
  ShoppingRequirement,
} from './household-shopping-consolidator.service';

@Injectable()
export class ShoppingListService {
  constructor(
    private readonly consolidator: HouseholdShoppingConsolidatorService,
  ) {}

  async generateList(
    requirements: ShoppingRequirement[] = [],
    inventory: InventoryAvailability[] = [],
  ) {
    const items = this.consolidator.missingOnly(requirements, inventory);
    await Promise.resolve();
    return {
      message: 'Shopping list generated',
      items,
      totalItems: items.length,
    };
  }
}
