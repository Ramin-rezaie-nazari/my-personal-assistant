import { BudgetIntelligenceService } from './budget-intelligence.service';

describe('BudgetIntelligenceService', () => {
  it('builds a deterministic user-scoped plan from inventory and compatible fresh prices', async () => {
    const inventory = {
      list: jest.fn().mockResolvedValue([
        {
          foodId: 'food-1',
          food: { name: 'Milk' },
          recommendedQuantity: 2,
          unit: 'L',
          urgency: 'critical',
        },
        {
          foodId: 'food-2',
          food: { name: 'Rice' },
          recommendedQuantity: 3,
          unit: 'kg',
          urgency: 'soon',
        },
      ]),
    };
    const prices = {
      latest: jest
        .fn()
        .mockResolvedValueOnce([
          {
            currency: 'USD',
            unit: 'L',
            unitPrice: 3,
            observedAt: '2026-09-12T10:00:00.000Z',
            sourceId: 'source-a',
          },
        ])
        .mockResolvedValueOnce([
          {
            currency: 'EUR',
            unit: 'kg',
            unitPrice: 2,
            observedAt: '2026-09-12T10:05:00.000Z',
            sourceId: 'source-b',
          },
        ]),
    };
    const productKeys = {
      fromFoodName: jest.fn((name: string) => name.toLowerCase()),
    };
    const service = new BudgetIntelligenceService(
      inventory as never,
      prices as never,
      productKeys as never,
    );

    const result = await service.createPlan('user-1', 10, 'USD');

    expect(inventory.list).toHaveBeenCalledWith('user-1');
    expect(productKeys.fromFoodName).toHaveBeenCalledWith('Milk');
    expect(result).toMatchObject({
      userId: 'user-1',
      budget: 10,
      currency: 'USD',
      totalEstimatedCost: 6,
      budgetRemaining: 4,
      pricedItemCount: 1,
      itemCount: 2,
      generatedDeterministically: true,
    });
    expect(result.items[0]).toMatchObject({
      foodId: 'food-1',
      price: 3,
      estimatedCost: 6,
      currency: 'USD',
      status: 'priced',
      priceSourceId: 'source-a',
    });
    expect(result.items[1]).toMatchObject({
      foodId: 'food-2',
      price: null,
      estimatedCost: null,
      status: 'currency_mismatch',
    });
  });

  it('rejects invalid budget and currency inputs', async () => {
    const service = new BudgetIntelligenceService(
      { list: jest.fn() } as never,
      { latest: jest.fn() } as never,
      { fromFoodName: jest.fn() } as never,
    );

    await expect(service.createPlan('user-1', -1, 'USD')).rejects.toThrow();
    await expect(service.createPlan('user-1', 10, 'US')).rejects.toThrow();
  });
});
