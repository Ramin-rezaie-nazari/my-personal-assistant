import { Injectable } from '@nestjs/common';
export type InventoryItem = { productKey: string; quantity: number; unit: string; dailyConsumption?: number; safetyStock?: number; essential?: boolean };
export type InventoryForecast = InventoryItem & { daysRemaining: number | null; reorderPoint: number; recommendedQuantity: number; urgency: 'critical' | 'soon' | 'normal' | 'none'; reason: string };
@Injectable()
export class HouseholdInventoryIntelligenceService {
  forecast(items: InventoryItem[]): InventoryForecast[] {
    return items.map((item) => {
      const consumption = Math.max(0, item.dailyConsumption ?? 0);
      const safetyStock = Math.max(0, item.safetyStock ?? 0);
      const reorderPoint = safetyStock;
      const daysRemaining = consumption > 0 ? item.quantity / consumption : null;
      const recommendedQuantity = Math.max(0, safetyStock * 2 - item.quantity);
      const urgency = item.quantity <= 0 ? 'critical' : daysRemaining !== null && daysRemaining <= 2 ? 'critical' : daysRemaining !== null && daysRemaining <= 7 ? 'soon' : item.quantity <= reorderPoint ? 'soon' : 'none';
      const reason = urgency === 'critical' ? 'stock_will_run_out_soon' : urgency === 'soon' ? 'below_reorder_threshold' : daysRemaining === null ? 'no_consumption_history' : 'stock_is_healthy';
      return { ...item, daysRemaining, reorderPoint, recommendedQuantity, urgency, reason };
    });
  }
  prioritize(items: InventoryItem[]): InventoryForecast[] { const rank = { critical: 0, soon: 1, normal: 2, none: 3 }; return this.forecast(items).sort((a, b) => rank[a.urgency] - rank[b.urgency] || Number(Boolean(b.essential)) - Number(Boolean(a.essential))); }
}
