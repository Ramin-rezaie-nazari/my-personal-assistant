import { FoodOperatingLoopService } from './food-operating-loop.service';

describe('FoodOperatingLoopService', () => {
  const prisma = {
    recipe: {
      findFirst: jest.fn(),
    },
  };
  const scaling = {
    scale: jest.fn(),
  };
  const matcher = {
    match: jest.fn(),
  };
  const shopping = {
    addRecipeMissing: jest.fn(),
  };
  const countryFood = {
    getLocalRecipeGuidance: jest.fn(),
  };
  const countryFinance = {
    getFinanceContext: jest.fn(),
  };

  const service = new FoodOperatingLoopService(
    prisma as never,
    scaling as never,
    matcher as never,
    shopping as never,
    countryFood as never,
    countryFinance as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('builds one deterministic food operating plan from recipe to shopping-ready missing items', async () => {
    prisma.recipe.findFirst
      .mockResolvedValueOnce({
        id: 'recipe-1',
        name: 'Example',
        servings: 2,
        userId: null,
        verified: true,
        calories: 800,
        protein: 60,
        carbs: 90,
        fat: 20,
        ingredients: [],
      })
      .mockResolvedValueOnce({
        id: 'recipe-1',
        name: 'Example',
        servings: 2,
        userId: null,
        verified: true,
        calories: 800,
        protein: 60,
        carbs: 90,
        fat: 20,
        ingredients: [
          {
            foodId: 'food-1',
            quantity: 200,
            unit: 'g',
          },
        ],
      });

    matcher.match.mockResolvedValue([
      {
        recipeId: 'recipe-1',
        name: 'Example',
        calories: 800,
        protein: 60,
        carbs: 90,
        fat: 20,
        coveragePercent: 50,
        missingCount: 1,
        missing: [{ foodId: 'food-1', name: 'Chicken', quantity: 100, unit: 'g' }],
        available: [],
        score: 48,
      },
    ]);
    scaling.scale.mockReturnValue({ targetServings: 50, ingredients: [] });
    countryFood.getLocalRecipeGuidance.mockReturnValue({ countryCode: 'JP' });
    countryFinance.getFinanceContext.mockReturnValue({ countryCode: 'JP', currencyCode: 'JPY' });

    const result = await service.buildPlan('user-1', 'recipe-1', 50, 'JP');

    expect(result.recipe.scaleFactor).toBe(25);
    expect(result.inventory.coveragePercent).toBe(50);
    expect(result.shopping.readyToAdd).toHaveLength(1);
    expect(result.financeContext).toEqual({ countryCode: 'JP', currencyCode: 'JPY' });
    expect(scaling.scale).toHaveBeenCalled();
  });

  it('adds only recipe-missing ingredients to shopping', async () => {
    const plan = {
      recipe: { id: 'recipe-1', name: 'Example', baseServings: 2, targetServings: 4, scaleFactor: 2 },
      scaledRecipe: { targetServings: 4 },
      inventory: { coveragePercent: 50, available: [], missing: [{ foodId: 'food-1', name: 'Chicken', quantity: 100, unit: 'g' }] },
      shopping: { readyToAdd: [{ foodId: 'food-1', name: 'Chicken', quantity: 100, unit: 'g' }], source: 'recipe' as const },
      localContext: null,
      financeContext: null,
    };
    jest.spyOn(service, 'buildPlan').mockResolvedValue(plan);
    shopping.addRecipeMissing.mockResolvedValue({ recipeId: 'recipe-1', added: 1 });

    const result = await service.addMissingToShopping('user-1', 'recipe-1', 4);

    expect(shopping.addRecipeMissing).toHaveBeenCalledWith('user-1', 'recipe-1', plan.inventory.missing);
    expect(result.shopping).toEqual({ recipeId: 'recipe-1', added: 1 });
  });
});
