import { MarketBudgetImpactService } from './market-budget-impact.service';

describe('MarketBudgetImpactService', () => {
  it('projects planned spending against the monthly budget', () => {
    const service = new MarketBudgetImpactService();
    const result = service.project(
      [
        {
          productKey: 'vacuum',
          quantity: 1,
          unitPrice: 12_000_000,
          priority: 10,
        },
        { productKey: 'ssd', quantity: 2, unitPrice: 2_000_000, priority: 5 },
      ],
      20_000_000,
      2_000_000,
    );
    expect(result.planned).toBe(16_000_000);
    expect(result.overBudget).toBe(false);
    expect(result.remainingAfter).toBe(2_000_000);
  });

  it('flags an unaffordable opportunity', () => {
    const service = new MarketBudgetImpactService();
    expect(service.opportunity(5_000, 2_000).affordable).toBe(false);
  });
});
