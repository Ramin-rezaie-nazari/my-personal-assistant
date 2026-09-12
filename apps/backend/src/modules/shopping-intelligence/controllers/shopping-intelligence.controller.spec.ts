import { ShoppingIntelligenceController } from './shopping-intelligence.controller';

describe('ShoppingIntelligenceController', () => {
  it('forwards the authenticated user id to the intelligence service', async () => {
    const shoppingService = {
      createShoppingPlan: jest.fn().mockResolvedValue({ userId: 'user-1' }),
    };
    const controller = new ShoppingIntelligenceController(
      shoppingService as never,
    );

    await expect(
      controller.getShoppingPlan({ user: { id: 'user-1' } }),
    ).resolves.toEqual({ userId: 'user-1' });
    expect(shoppingService.createShoppingPlan).toHaveBeenCalledWith('user-1');
  });
});
