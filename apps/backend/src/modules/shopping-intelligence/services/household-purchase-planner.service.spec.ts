import { HouseholdPurchasePlannerService } from './household-purchase-planner.service';
import { HouseholdInventoryIntelligenceService } from './household-inventory-intelligence.service';

describe('HouseholdPurchasePlannerService', () => {
  const service = new HouseholdPurchasePlannerService(
    new HouseholdInventoryIntelligenceService(),
  );

  it('buys critical stock when affordable and available', () => {
    const result = service.plan(
      [
        {
          productKey: 'milk',
          quantity: 0,
          unit: 'L',
          dailyConsumption: 1,
          safetyStock: 2,
          essential: true,
        },
      ],
      [
        {
          productKey: 'milk',
          price: 3,
          currency: 'USD',
          available: true,
          buyScore: 0.9,
        },
      ],
      10,
      new Date('2026-08-01T00:00:00Z'),
    );
    expect(result.items[0].action).toBe('buy');
    expect(result.items[0].reason).toBe('inventory_need_and_budget_align');
    expect(result.currency).toBe('USD');
    expect(result.totalEstimatedCost).toBe(6);
    expect(result.budgetRemainingAfterPlan).toBe(4);
  });

  it('does not overspend when multiple essentials compete for budget', () => {
    const result = service.plan(
      [
        {
          productKey: 'milk',
          quantity: 0,
          unit: 'L',
          dailyConsumption: 1,
          safetyStock: 2,
          essential: true,
        },
        {
          productKey: 'eggs',
          quantity: 0,
          unit: 'pcs',
          dailyConsumption: 2,
          safetyStock: 6,
          essential: true,
        },
      ],
      [
        {
          productKey: 'milk',
          price: 3,
          currency: 'USD',
          available: true,
          buyScore: 0.9,
        },
        {
          productKey: 'eggs',
          price: 1,
          currency: 'USD',
          available: true,
          buyScore: 0.9,
        },
      ],
      5,
      new Date('2026-08-01T00:00:00Z'),
    );
    expect(result.totalEstimatedCost).toBeLessThanOrEqual(5);
    expect(result.budgetRemainingAfterPlan).toBeGreaterThanOrEqual(0);
  });

  it('never treats an unavailable price as a free purchase', () => {
    const result = service.plan(
      [{ productKey: 'rice', quantity: 0, unit: 'kg', dailyConsumption: 1, safetyStock: 1 }],
      [{ productKey: 'rice', price: 0, currency: 'EUR', available: false }],
      100,
    );
    expect(result.items[0].action).toBe('watch');
    expect(result.items[0].reason).toBe('price_unavailable');
    expect(result.totalEstimatedCost).toBe(0);
  });
});
