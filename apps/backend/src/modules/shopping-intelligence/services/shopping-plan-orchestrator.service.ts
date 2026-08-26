import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { HouseholdInventoryIntelligenceService } from './household-inventory-intelligence.service';
import { HouseholdPurchasePlannerService, HouseholdPrice } from './household-purchase-planner.service';

@Injectable()
export class ShoppingPlanOrchestratorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: HouseholdInventoryIntelligenceService,
    private readonly planner: HouseholdPurchasePlannerService,
  ) {}

  async build(userId: string, budgetRemaining = 0, prices: HouseholdPrice[] = []) {
    const inventory = await this.prisma.inventoryItem.findMany({ where: { userId } });
    const items = inventory.map((item) => ({
      productKey: item.foodId,
      quantity: item.quantity,
      unit: item.unit,
      dailyConsumption: item.dailyConsumption,
      safetyStock: item.safetyStock,
      essential: item.essential,
      expiresAt: item.expiresAt,
    }));
    const forecasts = this.inventory.prioritize(items);
    const plan = this.planner.plan(items, prices, Math.max(0, budgetRemaining));
    const foods = await this.prisma.foodItem.findMany({
      where: { id: { in: forecasts.map((item) => item.productKey) } },
      select: { id: true, name: true, category: true },
    });
    const names = new Map(foods.map((food) => [food.id, food]));
    return {
      generatedDeterministically: true,
      budgetRemaining: Math.max(0, budgetRemaining),
      totalEstimatedCost: plan.totalEstimatedCost,
      budgetRemainingAfterPlan: plan.budgetRemainingAfterPlan,
      currency: plan.currency,
      items: plan.items.map((item) => ({ ...item, name: names.get(item.productKey)?.name ?? item.productKey, category: names.get(item.productKey)?.category ?? null })),
      forecasts: forecasts.map((item) => ({ ...item, name: names.get(item.productKey)?.name ?? item.productKey })),
    };
  }
}
