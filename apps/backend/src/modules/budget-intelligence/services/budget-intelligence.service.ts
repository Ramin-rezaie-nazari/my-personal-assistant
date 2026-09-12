import { BadRequestException, Injectable } from '@nestjs/common';
import { InventoryService } from '../../inventory/inventory.service';
import { PricePersistenceService } from '../../price-intelligence/services/price-persistence.service';
import { PriceProductKeyService } from '../../price-intelligence/services/price-product-key.service';

const PRICE_FRESHNESS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type MealBudgetPlanItem = {
  foodId: string;
  name: string;
  productKey: string;
  recommendedQuantity: number;
  unit: string;
  price: number | null;
  estimatedCost: number | null;
  currency: string;
  priceObservedAt: Date | null;
  priceSourceId: string | null;
  status: 'priced' | 'price_unavailable' | 'currency_mismatch' | 'unit_mismatch' | 'stale_price' | 'over_budget';
  urgency: 'critical' | 'soon' | 'normal' | 'none';
  reason: string;
};

@Injectable()
export class BudgetIntelligenceService {
  constructor(
    private readonly inventory: InventoryService,
    private readonly prices: PricePersistenceService,
    private readonly productKeys: PriceProductKeyService,
  ) {}

  async createPlan(userId: string, budget: number, currency: string) {
    if (!Number.isFinite(budget) || budget < 0)
      throw new BadRequestException('budget must be a non-negative number');

    const normalizedCurrency = currency.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(normalizedCurrency))
      throw new BadRequestException('currency must be a 3-letter ISO currency code');

    const inventory = await this.inventory.list(userId);
    const candidates = inventory.filter(
      (item) => Number(item.recommendedQuantity ?? 0) > 0 && item.food?.name,
    );

    const items: MealBudgetPlanItem[] = [];
    let remaining = budget;
    let pricedCount = 0;
    const now = Date.now();

    for (const item of candidates) {
      const foodId = String(item.foodId);
      const name = item.food!.name;
      const productKey = this.productKeys.fromFoodName(name);
      const rows = (await this.prices.latest(productKey)) as Array<{
        currency?: string;
        unit?: string | null;
        unitPrice?: number | null;
        amount?: number | null;
        observedAt?: Date | string;
        sourceId?: string;
      }>;

      const compatibleCurrency = rows.filter(
        (row) => row.currency === normalizedCurrency,
      );
      if (!compatibleCurrency.length) {
        items.push({
          foodId,
          name,
          productKey,
          recommendedQuantity: item.recommendedQuantity,
          unit: item.unit,
          price: null,
          estimatedCost: null,
          currency: normalizedCurrency,
          priceObservedAt: null,
          priceSourceId: null,
          status: rows.length ? 'currency_mismatch' : 'price_unavailable',
          urgency: item.urgency,
          reason: rows.length
            ? 'no_price_in_budget_currency'
            : 'no_price_snapshot',
        });
        continue;
      }

      const compatibleUnit = compatibleCurrency
        .filter((row) => row.unit === item.unit && row.unitPrice != null)
        .sort(
          (a, b) =>
            new Date(b.observedAt ?? 0).getTime() -
            new Date(a.observedAt ?? 0).getTime(),
        )[0];
      if (!compatibleUnit) {
        items.push({
          foodId,
          name,
          productKey,
          recommendedQuantity: item.recommendedQuantity,
          unit: item.unit,
          price: null,
          estimatedCost: null,
          currency: normalizedCurrency,
          priceObservedAt: null,
          priceSourceId: null,
          status: compatibleCurrency.some((row) => row.unit)
            ? 'unit_mismatch'
            : 'price_unavailable',
          urgency: item.urgency,
          reason: compatibleCurrency.some((row) => row.unit)
            ? 'price_unit_does_not_match_inventory_unit'
            : 'price_unit_missing',
        });
        continue;
      }

      const observedAt = new Date(compatibleUnit.observedAt ?? 0);
      if (!Number.isFinite(observedAt.getTime())) {
        items.push({
          foodId,
          name,
          productKey,
          recommendedQuantity: item.recommendedQuantity,
          unit: item.unit,
          price: null,
          estimatedCost: null,
          currency: normalizedCurrency,
          priceObservedAt: null,
          priceSourceId: compatibleUnit.sourceId ?? null,
          status: 'price_unavailable',
          urgency: item.urgency,
          reason: 'invalid_observed_at',
        });
        continue;
      }

      if (now - observedAt.getTime() > PRICE_FRESHNESS_WINDOW_MS) {
        items.push({
          foodId,
          name,
          productKey,
          recommendedQuantity: item.recommendedQuantity,
          unit: item.unit,
          price: null,
          estimatedCost: null,
          currency: normalizedCurrency,
          priceObservedAt: observedAt,
          priceSourceId: compatibleUnit.sourceId ?? null,
          status: 'stale_price',
          urgency: item.urgency,
          reason: 'price_snapshot_older_than_7_days',
        });
        continue;
      }

      const price = Number(compatibleUnit.unitPrice);
      const estimatedCost = price * Number(item.recommendedQuantity);
      if (!Number.isFinite(price) || price < 0 || !Number.isFinite(estimatedCost)) {
        items.push({
          foodId,
          name,
          productKey,
          recommendedQuantity: item.recommendedQuantity,
          unit: item.unit,
          price: null,
          estimatedCost: null,
          currency: normalizedCurrency,
          priceObservedAt: null,
          priceSourceId: null,
          status: 'price_unavailable',
          urgency: item.urgency,
          reason: 'invalid_price_value',
        });
        continue;
      }

      if (estimatedCost > remaining) {
        items.push({
          foodId,
          name,
          productKey,
          recommendedQuantity: item.recommendedQuantity,
          unit: item.unit,
          price,
          estimatedCost,
          currency: normalizedCurrency,
          priceObservedAt: observedAt,
          priceSourceId: compatibleUnit.sourceId ?? null,
          status: 'over_budget',
          urgency: item.urgency,
          reason: 'recommended_quantity_exceeds_remaining_budget',
        });
        continue;
      }

      remaining -= estimatedCost;
      pricedCount += 1;
      items.push({
        foodId,
        name,
        productKey,
        recommendedQuantity: item.recommendedQuantity,
        unit: item.unit,
        price,
        estimatedCost,
        currency: normalizedCurrency,
        priceObservedAt: observedAt,
        priceSourceId: compatibleUnit.sourceId ?? null,
        status: 'priced',
        urgency: item.urgency,
        reason: 'inventory_need_and_budget_align',
      });
    }

    const totalEstimatedCost = Number((budget - remaining).toFixed(2));
    const pricedItems = items.filter((item) => item.status === 'priced');

    return {
      userId,
      budget,
      currency: normalizedCurrency,
      totalEstimatedCost,
      budgetRemaining: Number(remaining.toFixed(2)),
      pricedItemCount: pricedCount,
      itemCount: items.length,
      budgetStatus:
        totalEstimatedCost > budget
          ? 'over_budget'
          : pricedItems.length === 0 && items.length > 0
            ? 'insufficient_price_data'
            : 'within_budget',
      generatedDeterministically: true,
      items,
    } as const;
  }
}
