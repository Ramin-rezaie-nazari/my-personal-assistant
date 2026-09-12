import { BadRequestException } from '@nestjs/common';
import { FoodOperatingLoopService } from './food-operating-loop.service';

describe('FoodOperatingLoopService', () => {
  const prisma = { recipe: { findFirst: jest.fn(), findMany: jest.fn() }, inventoryItem: { findMany: jest.fn() }, nutritionProfile: { findUnique: jest.fn() } };
  const scaling = { scale: jest.fn() };
  const shopping = { addRecipeMissing: jest.fn() };
  const budget = { quoteItems: jest.fn() };
  const countryFood = { getLocalRecipeGuidance: jest.fn(), rankRecipesForCountry: jest.fn((countryCode, recipes) => recipes) };
  const countryFinance = { getFinanceContext: jest.fn() };
  const safetyTaxonomy = { evaluate: jest.fn(() => ({ allowed: true, resolutions: [] })) };

  const service = new FoodOperatingLoopService(prisma as never, scaling as never, shopping as never, budget as never, countryFood as never, countryFinance as never, safetyTaxonomy as never);
  beforeEach(() => jest.clearAllMocks());

  it('rejects invalid target servings as a bad request', async () => {
    await expect(service.buildPlan('user-1', 'recipe-1', 0)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.buildBudgetPlan('user-1', 'recipe-1', Number.NaN, 100, 'IRR')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.recommend('user-1', 1.5)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.recipe.findFirst).not.toHaveBeenCalled();
    expect(prisma.recipe.findMany).not.toHaveBeenCalled();
  });

  it('builds a target-serving plan and compares inventory using scaled quantities', async () => {
    prisma.recipe.findFirst.mockResolvedValue({ id: 'recipe-1', name: 'Example', servings: 2, userId: null, verified: true, calories: 800, protein: 60, carbs: 90, fat: 20, ingredients: [{ foodId: 'food-1', quantity: 200, unit: 'g', food: { name: 'Chicken' } }] });
    prisma.inventoryItem.findMany.mockResolvedValue([{ userId: 'user-1', foodId: 'food-1', quantity: 5, unit: 'kg', food: { name: 'Chicken' } }]);
    scaling.scale.mockReturnValue({ targetServings: 50, scaleFactor: 25, ingredients: [{ ingredientId: 'food-1', baseQuantity: 200, scaledQuantity: 5000, unit: 'g' }], nutritionForFullBatch: { calories: 20000 }, nutritionPerServing: { calories: 400, proteinGrams: 30 } });
    countryFood.getLocalRecipeGuidance.mockReturnValue({ countryCode: 'JP' }); countryFinance.getFinanceContext.mockReturnValue({ countryCode: 'JP', currencyCode: 'JPY' });
    const result = await service.buildPlan('user-1', 'recipe-1', 50, 'JP');
    expect(result.recipe.scaleFactor).toBe(25); expect(result.inventory.coveragePercent).toBe(100); expect(result.inventory.missing).toEqual([]); expect(result.inventory.available[0]).toEqual({ foodId: 'food-1', name: 'Chicken', quantity: 5000, unit: 'g' }); expect(result.financeContext).toEqual({ countryCode: 'JP', currencyCode: 'JPY' });
  });

  it('builds budget impact from scaled missing ingredients and reports partial evidence when one item is blocked', async () => {
    prisma.recipe.findFirst.mockResolvedValue({ id: 'recipe-1', name: 'Example', servings: 2, userId: null, verified: true, calories: 800, protein: 60, carbs: 90, fat: 20, ingredients: [
      { foodId: 'food-1', quantity: 200, unit: 'g', food: { name: 'Chicken' } }, { foodId: 'food-2', quantity: 100, unit: 'g', food: { name: 'Rice' } },
    ] });
    prisma.inventoryItem.findMany.mockResolvedValue([{ userId: 'user-1', foodId: 'food-1', quantity: 0, unit: 'g', food: { name: 'Chicken' } }]);
    scaling.scale.mockReturnValue({ targetServings: 4, scaleFactor: 2, ingredients: [
      { ingredientId: 'food-1', scaledQuantity: 400, unit: 'g' }, { ingredientId: 'food-2', scaledQuantity: 200, unit: 'g' },
    ], nutritionForFullBatch: { calories: 1600 }, nutritionPerServing: { calories: 400, proteinGrams: 30 } });
    countryFood.getLocalRecipeGuidance.mockReturnValue(null); countryFinance.getFinanceContext.mockReturnValue(null);
    budget.quoteItems.mockResolvedValue({ items: [
      { foodId: 'food-1', name: 'Chicken', recommendedQuantity: 400, unit: 'g', status: 'priced', price: 0.02, estimatedCost: 8 },
      { foodId: 'food-2', name: 'Rice', recommendedQuantity: 200, unit: 'g', status: 'currency_mismatch', price: null, estimatedCost: null },
    ], totalEstimatedCost: 8, budgetRemaining: 2 });
    const result = await service.buildBudgetPlan('user-1', 'recipe-1', 4, 10, 'USD');
    expect(budget.quoteItems).toHaveBeenCalledWith([
      { foodId: 'food-1', name: 'Chicken', quantity: 400, unit: 'g', urgency: 'soon' },
      { foodId: 'food-2', name: 'Rice', quantity: 200, unit: 'g', urgency: 'soon' },
    ], 'USD', 10);
    expect(result.budget).toMatchObject({ totalEstimatedCost: 8, budgetRemaining: 2, status: 'partial_price_evidence' });
  });

  it('adds only budget-qualified missing ingredients to shopping', async () => {
    const plan = { recipe: { id: 'recipe-1', name: 'Example', baseServings: 2, targetServings: 4, scaleFactor: 2 }, scaledRecipe: { targetServings: 4 }, inventory: { coveragePercent: 0, available: [], missing: [{ foodId: 'food-1', name: 'Chicken', quantity: 400, unit: 'g' }, { foodId: 'food-2', name: 'Rice', quantity: 200, unit: 'g' }] }, shopping: { readyToAdd: [], source: 'recipe' as const }, localContext: null, financeContext: null, budget: { budget: 10, currency: 'USD', totalEstimatedCost: 8, budgetRemaining: 2, status: 'partial_price_evidence', generatedDeterministically: true, items: [{ foodId: 'food-1', recommendedQuantity: 400, unit: 'g', status: 'priced' }, { foodId: 'food-2', recommendedQuantity: 200, unit: 'g', status: 'currency_mismatch' }] } };
    jest.spyOn(service, 'buildBudgetPlan').mockResolvedValue(plan as never); shopping.addRecipeMissing.mockResolvedValue({ recipeId: 'recipe-1', added: 1 });
    const result = await service.addBudgetQualifiedMissingToShopping('user-1', 'recipe-1', 4, 10, 'USD');
    expect(shopping.addRecipeMissing).toHaveBeenCalledWith('user-1', 'recipe-1', [{ foodId: 'food-1', quantity: 400, unit: 'g' }]); expect(result.shopping).toEqual({ recipeId: 'recipe-1', added: 1 });
  });

  it('adds only scaled recipe-missing ingredients to shopping', async () => {
    const plan = { recipe: { id: 'recipe-1', name: 'Example', baseServings: 2, targetServings: 4, scaleFactor: 2 }, scaledRecipe: { targetServings: 4 }, inventory: { coveragePercent: 50, available: [], missing: [{ foodId: 'food-1', name: 'Chicken', quantity: 200, unit: 'g' }] }, shopping: { readyToAdd: [{ foodId: 'food-1', name: 'Chicken', quantity: 200, unit: 'g' }], source: 'recipe' as const }, localContext: null, financeContext: null };
    jest.spyOn(service, 'buildPlan').mockResolvedValue(plan as never); shopping.addRecipeMissing.mockResolvedValue({ recipeId: 'recipe-1', added: 1 });
    const result = await service.addMissingToShopping('user-1', 'recipe-1', 4); expect(shopping.addRecipeMissing).toHaveBeenCalledWith('user-1', 'recipe-1', plan.inventory.missing); expect(result.shopping).toEqual({ recipeId: 'recipe-1', added: 1 });
  });

  it('recommends recipes using inventory coverage and nutrition targets', async () => {
    prisma.recipe.findMany.mockResolvedValue([{ id: 'recipe-1', name: 'Chicken Bowl', servings: 2, userId: null, verified: true, calories: 800, protein: 80, carbs: 60, fat: 20, ingredients: [{ foodId: 'food-1', quantity: 200, unit: 'g', food: { name: 'Chicken' } }] }]);
    prisma.inventoryItem.findMany.mockResolvedValue([{ foodId: 'food-1', quantity: 1, unit: 'kg' }]); prisma.nutritionProfile.findUnique.mockResolvedValue({ dailyCaloriesGoal: 2000, proteinGoalGrams: 120 });
    scaling.scale.mockReturnValue({ targetServings: 2, scaleFactor: 1, ingredients: [{ ingredientId: 'food-1', scaledQuantity: 200, unit: 'g' }], nutritionForFullBatch: { calories: 800 }, nutritionPerServing: { calories: 400, proteinGrams: 40 } });
    const result = await service.recommend('user-1', 2, 'JP'); expect(safetyTaxonomy.evaluate).toHaveBeenCalledWith(['Chicken'], {}); expect(result).toHaveLength(1); expect(result[0].name).toBe('Chicken Bowl'); expect(result[0].coveragePercent).toBe(100); expect(result[0].proteinPerServing).toBe(40);
  });

  it('passes allergy and diet constraints to the safety layer', async () => {
    prisma.recipe.findMany.mockResolvedValue([{ id: 'recipe-1', name: 'Chicken Bowl', servings: 1, userId: null, verified: true, calories: 500, protein: 30, carbs: 50, fat: 10, ingredients: [{ foodId: 'food-1', quantity: 100, unit: 'g', food: { name: 'Chicken' } }] }]); prisma.inventoryItem.findMany.mockResolvedValue([]); prisma.nutritionProfile.findUnique.mockResolvedValue(null); scaling.scale.mockReturnValue({ targetServings: 1, scaleFactor: 1, ingredients: [{ ingredientId: 'food-1', scaledQuantity: 100, unit: 'g' }], nutritionForFullBatch: { calories: 500 }, nutritionPerServing: { calories: 500, proteinGrams: 30 } });
    await service.recommend('user-1', 1, 'IR', undefined, undefined, { allergies: ['milk'], dietaryPreferences: ['vegetarian'] }); expect(safetyTaxonomy.evaluate).toHaveBeenCalledWith(['Chicken'], { allergies: ['milk'], dietaryPreferences: ['vegetarian'] });
  });

  it('filters out recipes rejected by the safety taxonomy', async () => {
    prisma.recipe.findMany.mockResolvedValue([{ id: 'recipe-1', name: 'Unsafe Bowl', servings: 1, userId: null, verified: true, calories: 500, protein: 30, carbs: 50, fat: 10, ingredients: [{ foodId: 'food-1', quantity: 100, unit: 'g', food: { name: 'Milk' } }] }]); prisma.inventoryItem.findMany.mockResolvedValue([]); prisma.nutritionProfile.findUnique.mockResolvedValue(null); scaling.scale.mockReturnValue({ targetServings: 1, scaleFactor: 1, ingredients: [{ ingredientId: 'food-1', scaledQuantity: 100, unit: 'g' }], nutritionForFullBatch: { calories: 500, proteinGrams: 30 }, nutritionPerServing: { calories: 500, proteinGrams: 30 } });
    safetyTaxonomy.evaluate.mockReturnValue({ allowed: false, reason: 'allergy:milk:Milk', resolutions: [] }); const result = await service.recommend('user-1', 1, 'IR', undefined, undefined, { allergies: ['milk'] }); expect(result).toEqual([]);
  });
});
