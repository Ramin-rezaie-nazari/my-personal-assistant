import { ShoppingBudgetPolicyService } from './shopping-budget-policy.service';

describe('ShoppingBudgetPolicyService', () => {
  const service = new ShoppingBudgetPolicyService();

  it('prioritizes essential critical items and never overspends', () => {
    const result = service.plan(
      [
        { productKey: 'milk', quantity: 4, unitPrice: 3, urgency: 'critical', essential: true },
        { productKey: 'snacks', quantity: 5, unitPrice: 2, urgency: 'normal', essential: false },
      ],
      10,
    );
    expect(result.spent).toBeLessThanOrEqual(10);
    expect(result.decisions[0].productKey).toBe('milk');
  });

  it('does not guess when price is unavailable', () => {
    const result = service.plan(
      [{ productKey: 'rice', quantity: 2, unitPrice: null, urgency: 'soon', essential: true }],
      10,
    );
    expect(result.decisions[0].action).toBe('watch');
    expect(result.decisions[0].reason).toBe('price_unavailable');
  });
});
