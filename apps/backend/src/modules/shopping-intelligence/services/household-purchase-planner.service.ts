import { Injectable } from '@nestjs/common';
import {
  HouseholdInventoryIntelligenceService,
  InventoryItem,
} from './household-inventory-intelligence.service';

export type HouseholdPrice = {
  productKey: string;
  price: number;
  currency: string;
  available: boolean;
  buyScore?: number;
};

export type HouseholdPurchasePlanItem = {
  productKey: string;
  quantity: number;
  price: number | null;
  currency: string | null;
  estimatedCost: number | null;
  urgency: 'critical' | 'soon' | 'normal' | 'none';
  expiryDaysRemaining: number | null;
  action: 'buy' | 'watch' | 'skip';
  reason:
    | 'inventory_need_and_budget_align'
    | 'budget_constraint'
    | 'monitor_price_or_stock'
    | 'price_unavailable'
    | 'no_reorder_needed';
};

@Injectable()
export class HouseholdPurchasePlannerService {
  constructor(
    private readonly inventory: HouseholdInventoryIntelligenceService,
  ) {}

  plan(
    items: InventoryItem[],
    prices: HouseholdPrice[],
    budgetRemaining: number,
    now = new Date(),
  ): {
    items: HouseholdPurchasePlanItem[];
    totalEstimatedCost: number;
    budgetRemainingAfterPlan: number;
    currency: string | null;
  } {
    const forecasts = this.inventory.prioritize(items, now);
    let remaining = Math.max(0, budgetRemaining);
    const plan: HouseholdPurchasePlanItem[] = [];
    let currency: string | null = null;

    for (const item of forecasts) {
      const price = prices.find(
        (candidate) => candidate.productKey === item.productKey,
      );
      if (price?.currency) currency ??= price.currency;
      const quantity = item.recommendedQuantity;
      if (quantity <= 0) {
        plan.push({
          productKey: item.productKey,
          quantity: 0,
          price: price?.price ?? null,
          currency: price?.currency ?? null,
          estimatedCost: 0,
          urgency: item.urgency,
          expiryDaysRemaining: item.expiryDaysRemaining,
          action: 'skip',
          reason: 'no_reorder_needed',
        });
        continue;
      }

      const unitPrice = price?.available && price.price > 0 ? price.price : null;
      const affordableQuantity =
        unitPrice !== null ? Math.floor(remaining / unitPrice) : 0;
      const purchaseQuantity =
        unitPrice !== null
          ? Math.min(quantity, affordableQuantity)
          : quantity;
      const estimatedCost =
        unitPrice !== null ? purchaseQuantity * unitPrice : null;
      const fullNeedAffordable =
        estimatedCost !== null && purchaseQuantity === quantity;
      const urgentEnoughToBuy =
        item.urgency === 'critical' ||
        (item.urgency === 'soon' && (price?.buyScore ?? 0.5) >= 0.5);
      const action =
        unitPrice === null
          ? 'watch'
          : purchaseQuantity <= 0
            ? 'skip'
            : urgentEnoughToBuy
              ? 'buy'
              : 'watch';

      if (action === 'buy' && estimatedCost !== null) {
        remaining -= estimatedCost;
      }

      plan.push({
        productKey: item.productKey,
        quantity: purchaseQuantity,
        price: price?.price ?? null,
        currency: price?.currency ?? null,
        estimatedCost,
        urgency: item.urgency,
        expiryDaysRemaining: item.expiryDaysRemaining,
        action,
        reason:
          unitPrice === null
            ? 'price_unavailable'
            : !fullNeedAffordable
              ? 'budget_constraint'
              : action === 'buy'
                ? 'inventory_need_and_budget_align'
                : 'monitor_price_or_stock',
      });
    }

    return {
      items: plan,
      totalEstimatedCost: budgetRemaining - remaining,
      budgetRemainingAfterPlan: remaining,
      currency,
    };
  }
}
