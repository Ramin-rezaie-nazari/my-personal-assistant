import { PurchasePlanService } from './purchase-plan.service';

describe('PurchasePlanService', () => {
  const service = new PurchasePlanService();

  it('prioritizes urgent buy-now items while respecting budget', () => {
    const plan = service.build({
      budgetRemaining: 100,
      currency: 'IRR',
      items: [
        {
          productKey: 'urgent',
          quantity: 1,
          unitPrice: 70,
          currency: 'IRR',
          urgency: 0.95,
          decision: 'buy_now',
          score: 0.9,
          reason: 'needed',
        },
        {
          productKey: 'nice-to-have',
          quantity: 1,
          unitPrice: 50,
          currency: 'IRR',
          urgency: 0.3,
          decision: 'buy_now',
          score: 0.9,
          reason: 'optional',
        },
      ],
    });
    expect(plan.selected.map((item) => item.productKey)).toEqual(['urgent']);
    expect(plan.selectedTotal).toBe(70);
    expect(plan.skipped[0].productKey).toBe('nice-to-have');
  });

  it('defers wait and compare-more decisions without spending the budget', () => {
    const plan = service.build({
      budgetRemaining: 100,
      currency: 'IRR',
      items: [
        {
          productKey: 'wait',
          quantity: 1,
          unitPrice: 30,
          currency: 'IRR',
          urgency: 0.9,
          decision: 'wait',
          score: 0.8,
          reason: 'falling_price',
        },
        {
          productKey: 'compare',
          quantity: 1,
          unitPrice: 20,
          currency: 'IRR',
          urgency: 0.2,
          decision: 'compare_more',
          score: 0.4,
          reason: 'uncertain',
        },
      ],
    });
    expect(plan.selected).toHaveLength(0);
    expect(plan.deferred.map((item) => item.productKey)).toEqual([
      'wait',
      'compare',
    ]);
    expect(plan.selectedTotal).toBe(0);
  });

  it('never violates the remaining budget', () => {
    const plan = service.build({
      budgetRemaining: 100,
      currency: 'IRR',
      items: [
        {
          productKey: 'big',
          quantity: 2,
          unitPrice: 80,
          currency: 'IRR',
          urgency: 0.2,
          decision: 'buy_now',
          score: 0.9,
          reason: 'sale',
        },
      ],
    });
    expect(plan.withinBudget).toBe(true);
    expect(plan.selectedTotal).toBeLessThanOrEqual(100);
  });
});
