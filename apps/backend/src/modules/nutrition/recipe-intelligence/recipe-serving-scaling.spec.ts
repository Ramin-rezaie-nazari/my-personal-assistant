import { RecipeContract, scaleRecipe } from './recipe-domain.types';

describe('scaleRecipe', () => {
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
        ingredientId: 'salt',
        role: 'spice',
        quantity: 5,
        unit: 'g',
        scalingPolicy: 'sublinear',
        scalingExponent: 0.85,
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

  it('scales a recipe from 2 to 50 servings', () => {
    const result = scaleRecipe(recipe, { targetServings: 50 });

    expect(result.baseServings).toBe(2);
    expect(result.targetServings).toBe(50);
    expect(result.scaleFactor).toBe(25);
    expect(result.ingredients[0].scaledQuantity).toBe(7500);
    expect(result.nutritionForFullBatch.calories).toBe(25000);
    expect(result.nutritionForFullBatch.proteinGrams).toBe(1500);
  });

  it('does not blindly scale fixed culinary items', () => {
    const result = scaleRecipe(recipe, { targetServings: 50 });

    const bayLeaf = result.ingredients.find((item) => item.ingredientId === 'bay-leaf');
    expect(bayLeaf?.scaledQuantity).toBe(2);
    expect(bayLeaf?.scalingPolicy).toBe('fixed');
  });

  it('reduces the risk of over-scaling non-linear ingredients', () => {
    const result = scaleRecipe(recipe, { targetServings: 50 });

    const salt = result.ingredients.find((item) => item.ingredientId === 'salt');
    expect(salt?.scaledQuantity).toBeLessThan(125);
    expect(salt?.scaledQuantity).toBeGreaterThan(5);
    expect(salt?.scalingPolicy).toBe('sublinear');
  });

  it('rejects zero or negative target servings', () => {
    expect(() => scaleRecipe(recipe, { targetServings: 0 })).toThrow();
    expect(() => scaleRecipe(recipe, { targetServings: -1 })).toThrow();
  });
});
