import { Injectable } from '@nestjs/common';
import { HouseholdInventoryIntelligenceService, InventoryItem } from './household-inventory-intelligence.service';

export type HouseholdPrice = { productKey: string; price: number; currency: string; available: boolean; buyScore?: number };
export type HouseholdPurchasePlanItem = { productKey: string; quantity: number; price: number | null; estimatedCost: number | null; urgency: 'critical' | 'soon' | 'normal' | 'none'; action: 'buy' | 'watch' | 'skip'; reason: string };

@Injectable()
export class HouseholdPurchasePlannerService {
  constructor(private readonly inventory: HouseholdInventoryIntelligenceService) {}
  plan(items: InventoryItem[], prices: HouseholdPrice[], budgetRemaining: number): { items: HouseholdPurchasePlanItem[]; totalEstimatedCost: number; budgetRemainingAfterPlan: number } {
    const forecasts = this.inventory.prioritize(items); let remaining = Math.max(0, budgetRemaining); const plan: HouseholdPurchasePlanItem[] = [];
    for (const item of forecasts) {
      const price = prices.find(p => p.productKey === item.productKey); const quantity = item.recommendedQuantity;
      if (quantity <= 0) { plan.push({ productKey: item.productKey, quantity: 0, price: price?.price ?? null, estimatedCost: 0, urgency: item.urgency, action: 'skip', reason: 'no_reorder_needed' }); continue; }
      const unitPrice = price?.available ? price.price : null; let purchaseQuantity = quantity;
      if (unitPrice !== null && unitPrice > 0 && quantity * unitPrice > remaining && item.urgency === 'critical') purchaseQuantity = Math.min(quantity, Math.floor(remaining / unitPrice));
      const estimatedCost = unitPrice !== null ? purchaseQuantity * unitPrice : null;
      const affordable = estimatedCost !== null && estimatedCost > 0 && estimatedCost <= remaining;
      const action = item.urgency === 'critical' && affordable ? 'buy' : item.urgency === 'soon' && affordable && (price?.buyScore ?? 0.5) >= 0.5 ? 'buy' : estimatedCost === null ? 'watch' : affordable ? 'watch' : 'skip';
      if (action === 'buy' && estimatedCost !== null) remaining -= estimatedCost;
      plan.push({ productKey: item.productKey, quantity: purchaseQuantity, price: price?.price ?? null, estimatedCost, urgency: item.urgency, action, reason: action === 'buy' ? 'inventory_need_and_budget_align' : action === 'watch' ? 'monitor_price_or_stock' : estimatedCost === null ? 'price_unavailable' : 'budget_constraint' });
    }
    return { items: plan, totalEstimatedCost: budgetRemaining - remaining, budgetRemainingAfterPlan: remaining };
  }
}
