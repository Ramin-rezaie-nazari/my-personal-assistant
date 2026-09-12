import { HouseholdPurchasePlannerService } from './household-purchase-planner.service';
import { HouseholdInventoryIntelligenceService } from '../../inventory/household-inventory-intelligence.service';

describe('HouseholdPurchasePlannerService', () => {
  const service = new HouseholdPurchasePlannerService(
    new HouseholdInventoryIntelligenceService(),
  );

  it('fills the computed critical reorder need and lets the budget constraint reduce it', () => {
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
      'USD',
    );
    expect(result.items[0]).toMatchObject({ action: 'buy', quantity: 3, estimatedCost: 9 });
    expect(result.totalEstimatedCost).toBe(9);
    expect(result.budgetRemainingAfterPlan).toBe(1);
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
      'USD',
    );
    expect(result.totalEstimatedCost).toBeLessThanOrEqual(5);
    expect(result.budgetRemainingAfterPlan).toBeGreaterThanOrEqual(0);
  });

  it('does not spend or expose a mismatched quote when the budget currency differs', () => {
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
          currency: 'EUR',
          available: true,
          buyScore: 0.9,
        },
      ],
      10,
      'USD',
    );
    expect(result.items[0]).toMatchObject({
      action: 'watch',
      price: null,
      estimatedCost: null,
      reason: 'price_currency_mismatch',
    });
    expect(result.totalEstimatedCost).toBe(0);
    expect(result.budgetRemainingAfterPlan).toBe(10);
  });
});
