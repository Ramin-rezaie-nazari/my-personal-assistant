import { HouseholdReorderForecastService } from './household-reorder-forecast.service';

describe('HouseholdReorderForecastService', () => {
  it('calculates a learned reorder point and urgency', () => {
    const consumption = {
      forecast: () => ({ productKey: 'milk', dailyRate: 1, confidence: 0.9, daysObserved: 10, sampleCount: 10, next7DayNeed: 7, next30DayNeed: 30 }),
    } as any;
    const service = new HouseholdReorderForecastService(consumption);
    const result = service.forecast({ productKey: 'milk', currentQuantity: 1, leadTimeDays: 2, safetyStockDays: 2 });
    expect(result.daysRemaining).toBe(1);
    expect(result.reorderPoint).toBe(4);
    expect(result.recommendedQuantity).toBe(33);
    expect(result.urgency).toBe('critical');
  });

  it('returns unknown urgency when there is no learned rate', () => {
    const service = new HouseholdReorderForecastService({ forecast: () => ({ dailyRate: 0 }) } as any);
    expect(service.forecast({ productKey: 'unknown', currentQuantity: 10 }).urgency).toBe('unknown');
  });
});
