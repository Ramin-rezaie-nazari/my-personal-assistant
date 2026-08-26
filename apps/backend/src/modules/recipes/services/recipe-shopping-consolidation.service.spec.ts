import { RecipeShoppingConsolidationService } from './recipe-shopping-consolidation.service';

describe('RecipeShoppingConsolidationService', () => {
  it('merges compatible ingredient quantities across recipes', async () => {
    const foodLoop = {
      buildPlan: jest
        .fn()
        .mockResolvedValueOnce({
          recipe: { id: 'r1', name: 'A', targetServings: 2 },
          inventory: { missing: [{ foodId: 'milk', name: 'Milk', quantity: 500, unit: 'ml' }], available: [], coveragePercent: 0 },
        })
        .mockResolvedValueOnce({
          recipe: { id: 'r2', name: 'B', targetServings: 2 },
          inventory: { missing: [{ foodId: 'milk', name: 'Milk', quantity: 0.5, unit: 'l' }], available: [], coveragePercent: 0 },
        }),
    } as never;
    const service = new RecipeShoppingConsolidationService(foodLoop);
    const result = await service.build('u1', [
      { recipeId: 'r1', servings: 2 },
      { recipeId: 'r2', servings: 2 },
    ]);
    expect(result.items[0].quantity).toBe(1);
    expect(result.items[0].unit).toBe('ml');
    expect(result.items[0].recipeIds).toEqual(['r1', 'r2']);
  });
});
