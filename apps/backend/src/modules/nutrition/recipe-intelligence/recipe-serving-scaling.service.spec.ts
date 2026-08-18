import { RecipeServingScalingService } from './recipe-serving-scaling.service';
import { RecipeContract } from './recipe-domain.types';

describe('RecipeServingScalingService', () => {
  const service = new RecipeServingScalingService();

  const recipe: RecipeContract = {
    id: 'recipe-test',
    canonicalName: 'Test Stew',
    localizedNames: { en: 'Test Stew' },
    countryCodes: ['XX'],
    regionIds: [],
    cuisineIds: ['test'],
    mealTypes: ['dinner'],
    dietaryTags: [],
    servings: 2,
    prepMinutes: 10,
    cookMinutes: 30,
    difficulty: 'easy',
    status: 'verified',
    sourceType: 'internal',
    version: 1,
    nutritionPerServing: {
      calories: 500,
      proteinGrams: 30,
      carbohydratesGrams: 40,
      fatGrams: 20,
    },
    ingredients: [
      {
        ingredientId: 'chicken',
        role: 'protein',
        quantity: 300,
        unit: 'g',
        scalingPolicy: 'linear',
      },
      {
        ingredientId: 'bay-leaf',
        role: 'spice',
        quantity: 2,
        unit: 'pieces',
        scalingPolicy: 'fixed',
      },
    ],
  };

  it('delegates to the shared deterministic scaling engine', () => {
    const result = service.scale(recipe, { targetServings: 50 });

    expect(result.scaleFactor).toBe(25);
    expect(result.targetServings).toBe(50);
    expect(result.ingredients[0]).toMatchObject({
      ingredientId: 'chicken',
      scaledQuantity: 7500,
      scalingPolicy: 'linear',
    });
    expect(result.ingredients[1]).toMatchObject({
      ingredientId: 'bay-leaf',
      scaledQuantity: 2,
      scalingPolicy: 'fixed',
    });
  });

  it('rejects invalid target servings at the application boundary', () => {
    expect(() => service.scale(recipe, { targetServings: 0 })).toThrow();
    expect(() => service.scale(recipe, { targetServings: -5 })).toThrow();
  });
});
