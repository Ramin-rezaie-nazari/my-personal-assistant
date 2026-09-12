import { ShoppingIntelligenceService } from './shopping-intelligence.service';

describe('ShoppingIntelligenceService', () => {
  it('builds a user-scoped deterministic plan from the canonical shopping domain', async () => {
    const shopping = {
      smartList: jest.fn().mockResolvedValue([
        {
          foodId: 'food-1',
          name: 'Milk',
          category: 'dairy',
          quantity: 0,
          unit: 'L',
          recommendedQuantity: 2,
          urgency: 'critical',
          reason: 'below_reorder_point',
          essential: true,
        },
      ]),
      listBasket: jest.fn().mockResolvedValue([
        { id: 'basket-1', foodId: 'food-1', quantity: 2, unit: 'L' },
      ]),
    };
    const service = new ShoppingIntelligenceService(shopping as never);

    const result = await service.createShoppingPlan('user-1');

    expect(shopping.smartList).toHaveBeenCalledWith('user-1');
    expect(shopping.listBasket).toHaveBeenCalledWith('user-1');
    expect(result).toMatchObject({
      userId: 'user-1',
      generatedDeterministically: true,
      counts: { recommended: 1, openBasket: 1 },
    });
    expect(result.items[0].foodId).toBe('food-1');
    expect(result.basket[0].id).toBe('basket-1');
  });
});
