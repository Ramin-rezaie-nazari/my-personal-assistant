import { BudgetIntelligenceService } from './budget-intelligence.service';

describe('BudgetIntelligenceService', () => {
  it('builds a deterministic user-scoped plan from inventory and compatible fresh prices', async () => {
    const inventory = { list: jest.fn().mockResolvedValue([
      { foodId: 'food-1', food: { name: 'Milk' }, recommendedQuantity: 2, unit: 'L', urgency: 'critical' },
      { foodId: 'food-2', food: { name: 'Rice' }, recommendedQuantity: 3, unit: 'kg', urgency: 'soon' },
    ]) };
    const prices = { latest: jest.fn()
      .mockResolvedValueOnce([{ currency: 'USD', unit: 'L', unitPrice: 3, observedAt: new Date(), sourceId: 'source-a' }])
      .mockResolvedValueOnce([{ currency: 'EUR', unit: 'kg', unitPrice: 2, observedAt: new Date(), sourceId: 'source-b' }]) };
    const productKeys = { fromFoodName: jest.fn((name: string) => name.toLowerCase()) };
    const service = new BudgetIntelligenceService(inventory as never, prices as never, productKeys as never);
    const result = await service.createPlan('user-1', 10, 'USD');
    expect(inventory.list).toHaveBeenCalledWith('user-1');
    expect(productKeys.fromFoodName).toHaveBeenCalledWith('Milk');
    expect(result).toMatchObject({ userId: 'user-1', budget: 10, currency: 'USD', totalEstimatedCost: 6, budgetRemaining: 4, pricedItemCount: 1, itemCount: 2, generatedDeterministically: true });
    expect(result.items[0]).toMatchObject({ foodId: 'food-1', price: 3, estimatedCost: 6, currency: 'USD', status: 'priced', priceSourceId: 'source-a' });
    expect(result.items[1]).toMatchObject({ foodId: 'food-2', price: null, estimatedCost: null, status: 'currency_mismatch' });
  });

  it('rejects stale price snapshots instead of treating them as current', async () => {
    const service = new BudgetIntelligenceService(
      { list: jest.fn().mockResolvedValue([{ foodId: 'food-1', food: { name: 'Milk' }, recommendedQuantity: 2, unit: 'L', urgency: 'critical' }]) } as never,
      { latest: jest.fn().mockResolvedValue([{ currency: 'USD', unit: 'L', unitPrice: 3, observedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), sourceId: 'source-a' }]) } as never,
      { fromFoodName: jest.fn(() => 'milk') } as never,
    );
    const result = await service.createPlan('user-1', 10, 'USD');
    expect(result.items[0]).toMatchObject({ price: null, estimatedCost: null, status: 'stale_price', reason: 'price_snapshot_older_than_7_days', priceSourceId: 'source-a' });
    expect(result.totalEstimatedCost).toBe(0);
  });

  it('reports over-budget when a priced requirement cannot fit within the remaining budget', async () => {
    const service = new BudgetIntelligenceService(
      { list: jest.fn().mockResolvedValue([{ foodId: 'food-1', food: { name: 'Milk' }, recommendedQuantity: 10, unit: 'L', urgency: 'critical' }]) } as never,
      { latest: jest.fn().mockResolvedValue([{ currency: 'USD', unit: 'L', unitPrice: 2, observedAt: new Date(), sourceId: 'source-a' }]) } as never,
      { fromFoodName: jest.fn(() => 'milk') } as never,
    );
    const result = await service.createPlan('user-1', 10, 'USD');
    expect(result.items[0]).toMatchObject({ status: 'over_budget', price: 2, estimatedCost: 20 });
    expect(result.totalEstimatedCost).toBe(0);
    expect(result.budgetStatus).toBe('over_budget');
  });

  it('quotes recipe missing items sequentially and refuses mismatched money evidence', async () => {
    const prices = { latest: jest.fn()
      .mockResolvedValueOnce([{ currency: 'USD', unit: 'g', unitPrice: 0.02, observedAt: new Date(), sourceId: 'fresh-chicken' }])
      .mockResolvedValueOnce([{ currency: 'EUR', unit: 'g', unitPrice: 0.01, observedAt: new Date(), sourceId: 'wrong-currency' }]) };
    const productKeys = { fromFoodName: jest.fn((name: string) => name.toLowerCase()) };
    const service = new BudgetIntelligenceService({ list: jest.fn() } as never, prices as never, productKeys as never);
    const result = await service.quoteItems([
      { foodId: 'food-1', name: 'Chicken', quantity: 200, unit: 'g' },
      { foodId: 'food-2', name: 'Rice', quantity: 500, unit: 'g' },
    ], 'USD', 10);
    expect(result.items[0]).toMatchObject({ status: 'priced', estimatedCost: 4, priceSourceId: 'fresh-chicken' });
    expect(result.items[1]).toMatchObject({ status: 'currency_mismatch', price: null, estimatedCost: null });
    expect(result.totalEstimatedCost).toBe(4);
    expect(result.budgetRemaining).toBe(6);
  });

  it('rejects invalid quote quantities', async () => {
    const service = new BudgetIntelligenceService({ list: jest.fn() } as never, { latest: jest.fn() } as never, { fromFoodName: jest.fn(() => 'x') } as never);
    await expect(service.quoteItems([{ foodId: 'food-1', name: 'Milk', quantity: 0, unit: 'L' }], 'USD', 10)).rejects.toThrow();
  });

  it('rejects invalid budget and currency inputs', async () => {
    const service = new BudgetIntelligenceService({ list: jest.fn() } as never, { latest: jest.fn() } as never, { fromFoodName: jest.fn() } as never);
    await expect(service.createPlan('user-1', -1, 'USD')).rejects.toThrow();
    await expect(service.createPlan('user-1', 10, 'US')).rejects.toThrow();
  });
});