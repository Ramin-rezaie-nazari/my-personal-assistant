import { HouseholdPurchasePlannerService } from './household-purchase-planner.service';
import { HouseholdInventoryIntelligenceService } from './household-inventory-intelligence.service';

describe('HouseholdPurchasePlannerService', () => {
  const service = new HouseholdPurchasePlannerService(new HouseholdInventoryIntelligenceService());
  it('buys critical stock when affordable and available', () => {
    const result = service.plan([{ productKey: 'milk', quantity: 2, unit: 'L', dailyConsumption: 1, safetyStock: 2, essential: true }], [{ productKey: 'milk', price: 3, currency: 'USD', available: true, buyScore: 0.9 }], 10);
    expect(result.items[0].action).toBe('buy'); expect(result.totalEstimatedCost).toBe(6); expect(result.budgetRemainingAfterPlan).toBe(4);
  });
  it('does not overspend when multiple essentials compete for budget', () => {
    const result = service.plan([{ productKey: 'milk', quantity: 0, unit: 'L', dailyConsumption: 1, safetyStock: 2, essential: true }, { productKey: 'eggs', quantity: 0, unit: 'pcs', dailyConsumption: 2, safetyStock: 6, essential: true }], [{ productKey: 'milk', price: 3, currency: 'USD', available: true, buyScore: 0.9 }, { productKey: 'eggs', price: 1, currency: 'USD', available: true, buyScore: 0.9 }], 5);
    expect(result.totalEstimatedCost).toBeLessThanOrEqual(5); expect(result.budgetRemainingAfterPlan).toBeGreaterThanOrEqual(0);
  });
});
