import { Injectable } from '@nestjs/common';
import { InventoryService } from '../inventory/inventory.service';

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
  constructor(private readonly inventory: InventoryService) {}

  async smartList(userId: string): Promise<SmartShoppingItem[]> {
    const inventory = await this.inventory.list(userId);
    return inventory
      .filter((item) => item.urgency === 'critical' || item.urgency === 'soon' || item.recommendedQuantity > 0)
      .map((item) => ({
        foodId: item.foodId,
        name: item.food.name,
        category: item.food.category,
        quantity: item.quantity,
        unit: item.unit,
        recommendedQuantity: item.recommendedQuantity,
        urgency: item.urgency,
        reason: item.reason,
        essential: item.essential,
      }))
      .sort((a, b) => Number(b.essential) - Number(a.essential) || this.priority(b.urgency) - this.priority(a.urgency) || a.name.localeCompare(b.name));
  }

  private priority(urgency: SmartShoppingItem['urgency']) {
    return urgency === 'critical' ? 3 : urgency === 'soon' ? 2 : urgency === 'normal' ? 1 : 0;
  }
}
