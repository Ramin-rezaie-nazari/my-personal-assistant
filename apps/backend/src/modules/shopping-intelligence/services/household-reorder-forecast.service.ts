import { Injectable } from '@nestjs/common';
import { HouseholdConsumptionLearningService } from './household-consumption-learning.service';

export type ReorderForecastInput = { productKey: string; currentQuantity: number; safetyStockDays?: number; leadTimeDays?: number };
export type ReorderForecast = ReorderForecastInput & { daysRemaining: number | null; reorderPoint: number; recommendedQuantity: number; urgency: 'critical' | 'soon' | 'normal' | 'unknown' };

@Injectable()
export class HouseholdReorderForecastService {
  constructor(private readonly consumption: HouseholdConsumptionLearningService) {}
  forecast(input: ReorderForecastInput, now = new Date()): ReorderForecast {
    const model = this.consumption.forecast(input.productKey, now);
    const dailyRate = model.dailyRate;
    if (dailyRate <= 0) return { ...input, daysRemaining: null, reorderPoint: 0, recommendedQuantity: 0, urgency: 'unknown' };
    const leadTimeDays = Math.max(0, input.leadTimeDays ?? 2);
    const safetyStockDays = Math.max(0, input.safetyStockDays ?? 2);
    const daysRemaining = input.currentQuantity / dailyRate;
    const reorderPoint = dailyRate * (leadTimeDays + safetyStockDays);
    const recommendedQuantity = Math.max(0, Math.ceil(model.next30DayNeed + dailyRate * (leadTimeDays + safetyStockDays) - input.currentQuantity));
    const urgency = daysRemaining <= leadTimeDays ? 'critical' : daysRemaining <= leadTimeDays + safetyStockDays ? 'soon' : 'normal';
    return { ...input, daysRemaining, reorderPoint, recommendedQuantity, urgency };
  }
}
