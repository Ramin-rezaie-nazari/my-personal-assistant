import { FoodOperatingLoopService } from './food-operating-loop.service';

describe('FoodOperatingLoopService', () => {
  const prisma = {
    recipe: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    inventoryItem: {
      findMany: jest.fn(),
    },
    nutritionProfile: {
      findUnique: jest.fn(),
    },
  };
  const scaling = {
    scale: jest.fn(),
  };
  const shopping = {
    addRecipeMissing: jest.fn(),
  };
  const countryFood = {
    getLocalRecipeGuidance: jest.fn(),
    rankRecipesForCountry: jest.fn((countryCode, recipes) => recipes),
  };
  const countryFinance = {
    getFinanceContext: jest.fn(),
  };

  const service = new FoodOperatingLoopService(
    prisma as never,
    scaling as never,
    shopping as never,
    countryFood as never,
    countryFinance as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('builds a target-serving plan and compares inventory using scaled quantities', async () => {
    prisma.recipe.findFirst.mockResolvedValue({
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
        { foodId: 'food-1', quantity: 200, unit: 'g', food: { name: 'Chicken' } },
      ],
    });
    prisma.inventoryItem.findMany.mockResolvedValue([
      { userId: 'user-1', foodId: 'food-1', quantity: 0.75, unit: 'kg', food: { name: 'Chicken' } },
    ]);
    scaling.scale.mockReturnValue({
      targetServings: 50,
      scaleFactor: 25,
      ingredients: [
        { ingredientId: 'food-1', baseQuantity: 200, scaledQuantity: 5000, unit: 'g' },
      ],
      nutritionForFullBatch: { calories: 20000 },
      nutritionPerServing: { calories: 400, proteinGrams: 30 },
    });
    countryFood.getLocalRecipeGuidance.mockReturnValue({ countryCode: 'JP' });
    countryFinance.getFinanceContext.mockReturnValue({ countryCode: 'JP', currencyCode: 'JPY' });

    const result = await service.buildPlan('user-1', 'recipe-1', 50, 'JP');

    expect(result.recipe.scaleFactor).toBe(25);
    expect(result.inventory.coveragePercent).toBe(100);
    expect(result.inventory.missing).toEqual([]);
    expect(result.inventory.available[0]).toEqual({
      foodId: 'food-1',
      name: 'Chicken',
      quantity: 5000,
      unit: 'g',
    });
    expect(result.financeContext).toEqual({ countryCode: 'JP', currencyCode: 'JPY' });
  });

  it('adds only scaled recipe-missing ingredients to shopping', async () => {
    const plan = {
      recipe: { id: 'recipe-1', name: 'Example', baseServings: 2, targetServings: 4, scaleFactor: 2 },
      scaledRecipe: { targetServings: 4 },
      inventory: {
        coveragePercent: 50,
        available: [],
        missing: [{ foodId: 'food-1', name: 'Chicken', quantity: 200, unit: 'g' }],
      },
      shopping: {
        readyToAdd: [{ foodId: 'food-1', name: 'Chicken', quantity: 200, unit: 'g' }],
        source: 'recipe' as const,
      },
      localContext: null,
      financeContext: null,
    };
    jest.spyOn(service, 'buildPlan').mockResolvedValue(plan);
    shopping.addRecipeMissing.mockResolvedValue({ recipeId: 'recipe-1', added: 1 });

    const result = await service.addMissingToShopping('user-1', 'recipe-1', 4);

    expect(shopping.addRecipeMissing).toHaveBeenCalledWith(
      'user-1',
      'recipe-1',
      plan.inventory.missing,
    );
    expect(result.shopping).toEqual({ recipeId: 'recipe-1', added: 1 });
  });

  it('recommends recipes using inventory coverage and nutrition targets', async () => {
    prisma.recipe.findMany.mockResolvedValue([
      {
        id: 'recipe-1',
        name: 'Chicken Bowl',
        servings: 2,
        userId: null,
        verified: true,
        calories: 800,
        protein: 80,
        carbs: 60,
        fat: 20,
        ingredients: [{ foodId: 'food-1', quantity: 200, unit: 'g' }],
      },
    ]);
    prisma.inventoryItem.findMany.mockResolvedValue([
      { foodId: 'food-1', quantity: 1, unit: 'kg' },
    ]);
    prisma.nutritionProfile.findUnique.mockResolvedValue({
      dailyCaloriesGoal: 2000,
      proteinGoalGrams: 150,
    });
    scaling.scale.mockReturnValue({
      targetServings: 2,
      scaleFactor: 1,
      ingredients: [{ ingredientId: 'food-1', scaledQuantity: 200, unit: 'g' }],
      nutritionForFullBatch: { calories: 800 },
      nutritionPerServing: { calories: 400, proteinGrams: 40 },
    });

    const result = await service.recommend('user-1', 2, 'JP');

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Chicken Bowl');
    expect(result[0].coveragePercent).toBe(100);
    expect(result[0].proteinPerServing).toBe(40);
  });
});
