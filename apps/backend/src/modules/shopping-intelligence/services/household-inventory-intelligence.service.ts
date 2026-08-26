import { Injectable } from '@nestjs/common';

export type InventoryItem = {
  productKey: string;
  quantity: number;
  unit: string;
  dailyConsumption?: number;
  safetyStock?: number;
  essential?: boolean;
  expiresAt?: Date | null;
};

export type InventoryForecast = InventoryItem & {
  daysRemaining: number | null;
  reorderPoint: number;
  recommendedQuantity: number;
  expiryDaysRemaining: number | null;
  urgency: 'critical' | 'soon' | 'normal' | 'none';
  reason:
    | 'stock_will_run_out_soon'
    | 'stock_expires_soon'
    | 'below_reorder_threshold'
    | 'no_consumption_history'
    | 'stock_is_healthy';
};

@Injectable()
export class HouseholdInventoryIntelligenceService {
  forecast(items: InventoryItem[], now = new Date()): InventoryForecast[] {
    return items.map((item) => {
      const consumption = Math.max(0, item.dailyConsumption ?? 0);
      const safetyStock = Math.max(0, item.safetyStock ?? 0);
      const reorderPoint = Math.max(safetyStock, consumption * 2 + safetyStock);
      const daysRemaining =
        consumption > 0 ? item.quantity / consumption : null;
      const expiryDaysRemaining = item.expiresAt
        ? (item.expiresAt.getTime() - now.getTime()) / 86_400_000
        : null;
      const targetQuantity = reorderPoint;
      const recommendedQuantity = Math.max(
        0,
        Math.ceil(targetQuantity - item.quantity),
      );
      const urgency =
        item.quantity <= 0
          ? 'critical'
          : daysRemaining !== null && daysRemaining <= 2
            ? 'critical'
            : expiryDaysRemaining !== null && expiryDaysRemaining <= 1
              ? 'critical'
              : daysRemaining !== null && daysRemaining <= 7
                ? 'soon'
                : expiryDaysRemaining !== null && expiryDaysRemaining <= 3
                  ? 'soon'
                  : item.quantity <= reorderPoint
                    ? 'soon'
                    : 'none';
      const reason =
        item.quantity <= 0 ||
        (daysRemaining !== null && daysRemaining <= 2)
          ? 'stock_will_run_out_soon'
          : expiryDaysRemaining !== null && expiryDaysRemaining <= 1
            ? 'stock_expires_soon'
            : urgency === 'soon'
              ? 'below_reorder_threshold'
              : daysRemaining === null
                ? 'no_consumption_history'
                : 'stock_is_healthy';
      return {
        ...item,
        daysRemaining,
        reorderPoint,
        recommendedQuantity,
        expiryDaysRemaining,
        urgency,
        reason,
      };
    });
  }

  prioritize(items: InventoryItem[], now = new Date()): InventoryForecast[] {
    const rank = { critical: 0, soon: 1, normal: 2, none: 3 };
    return this.forecast(items, now).sort(
      (a, b) =>
        rank[a.urgency] - rank[b.urgency] ||
        Number(Boolean(b.essential)) - Number(Boolean(a.essential)) ||
        (a.expiryDaysRemaining ?? Number.POSITIVE_INFINITY) -
          (b.expiryDaysRemaining ?? Number.POSITIVE_INFINITY),
    );
  }
}
