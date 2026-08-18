import { RecipeServingScalingService } from '../../nutrition/recipe-intelligence/recipe-serving-scaling.service';
import { RecipesService } from './recipes.service';

describe('RecipesService scaling', () => {
  it('scales a persisted two-serving recipe to fifty servings', async () => {
    const prisma = {
      recipe: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'recipe-1',
          userId: 'user-1',
          name: 'Test Stew',
          calories: 1000,
          protein: 60,
          carbs: 80,
          fat: 40,
          servings: 2,
          verified: true,
          ingredients: [{
            foodId: 'chicken', quantity: 300, unit: 'g', measurementKind: 'mass', scalingPolicy: 'linear', scalingExponent: null, batchSize: null, maxLinearMultiplier: null,
            food: { id: 'chicken', name: 'Chicken' },
          }],
        }),
      },
    };

    const service = new RecipesService(prisma as never, new RecipeServingScalingService());
    const result = await service.getScaledRecipe('user-1', 'recipe-1', 50);

    expect(result.recipe.baseServings).toBe(2);
    expect(result.targetServings).toBe(50);
    expect(result.scaleFactor).toBe(25);
    expect(result.ingredients[0].scaledQuantity).toBe(7500);
    expect(result.nutritionForFullBatch.calories).toBe(25000);
    expect(result.nutritionPerServing.calories).toBe(500);
  });

  it('uses the stored base serving count rather than assuming two servings', async () => {
    const prisma = {
      recipe: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'recipe-2', userId: 'user-1', name: 'Family Rice', calories: 2400, protein: 120, carbs: 300, fat: 60,
          servings: 6, verified: false,
          ingredients: [{
            foodId: 'rice', quantity: 600, unit: 'g', measurementKind: 'mass', scalingPolicy: 'linear', scalingExponent: null, batchSize: null, maxLinearMultiplier: null,
            food: { id: 'rice', name: 'Rice' },
          }],
        }),
      },
    };

    const service = new RecipesService(prisma as never, new RecipeServingScalingService());
    const result = await service.getScaledRecipe('user-1', 'recipe-2', 12);

    expect(result.recipe.baseServings).toBe(6);
    expect(result.scaleFactor).toBe(2);
    expect(result.ingredients[0].scaledQuantity).toBe(1200);
    expect(result.nutritionPerServing.calories).toBe(400);
    expect(result.nutritionForFullBatch.calories).toBe(4800);
  });

  it('uses persisted non-linear scaling policies instead of reverting to linear', async () => {
    const prisma = {
      recipe: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'recipe-3', userId: 'user-1', name: 'Seasoned Stew', calories: 1000, protein: 60, carbs: 80, fat: 40,
          servings: 2, verified: true,
          ingredients: [
            { foodId: 'salt', quantity: 5, unit: 'g', measurementKind: 'mass', scalingPolicy: 'sublinear', scalingExponent: 0.85, batchSize: null, maxLinearMultiplier: null, food: { id: 'salt', name: 'Salt' } },
            { foodId: 'bay', quantity: 1, unit: 'piece', measurementKind: 'count', scalingPolicy: 'fixed', scalingExponent: null, batchSize: null, maxLinearMultiplier: null, food: { id: 'bay', name: 'Bay Leaf' } },
          ],
        }),
      },
    };

    const service = new RecipesService(prisma as never, new RecipeServingScalingService());
    const result = await service.getScaledRecipe('user-1', 'recipe-3', 50);

    expect(result.ingredients[0].scalingPolicy).toBe('sublinear');
    expect(result.ingredients[0].scaledQuantity).toBeLessThan(125);
    expect(result.ingredients[1].scalingPolicy).toBe('fixed');
    expect(result.ingredients[1].scaledQuantity).toBe(1);
  });
});
