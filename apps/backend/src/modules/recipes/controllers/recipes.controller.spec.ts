import { BadRequestException } from '@nestjs/common';
import { RecipesController } from './recipes.controller';

describe('RecipesController food operating loop', () => {
  const recipesService = {
    getScaledRecipe: jest.fn(),
  };
  const matcher = {
    match: jest.fn(),
  };
  const globalCountryFood = {
    getLocalRecipeGuidance: jest.fn(),
    getSupportedCountryCodes: jest.fn(),
    rankRecipesForCountry: jest.fn((countryCode, recipes) => recipes),
  };
  const foodOperatingLoop = {
    buildPlan: jest.fn(),
    addMissingToShopping: jest.fn(),
    recommend: jest.fn(),
  };
  const controller = new RecipesController(
    recipesService as never,
    matcher as never,
    globalCountryFood as never,
    foodOperatingLoop as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires the target serving count', () => {
    expect(() =>
      controller.scale({ user: { id: 'user-1' } }, 'recipe-1', undefined),
    ).toThrow(BadRequestException);

    expect(() =>
      controller.foodPlan({ user: { id: 'user-1' } }, 'recipe-1', undefined),
    ).toThrow(BadRequestException);

    expect(() =>
      controller.recommendations({ user: { id: 'user-1' } }, undefined),
    ).toThrow(BadRequestException);
  });

  it('passes a normalized serving count to the Recipe service', async () => {
    recipesService.getScaledRecipe.mockResolvedValue({ targetServings: 50 });

    await expect(
      controller.scale({ user: { id: 'user-1' } }, 'recipe-1', '50'),
    ).resolves.toEqual({ targetServings: 50 });

    expect(recipesService.getScaledRecipe).toHaveBeenCalledWith(
      'user-1',
      'recipe-1',
      50,
    );
  });

  it('passes servings and country into the food operating loop', async () => {
    foodOperatingLoop.buildPlan.mockResolvedValue({
      recipe: { id: 'recipe-1', targetServings: 50 },
    });

    await expect(
      controller.foodPlan(
        { user: { id: 'user-1' } },
        'recipe-1',
        '50',
        'JP',
      ),
    ).resolves.toEqual({
      recipe: { id: 'recipe-1', targetServings: 50 },
    });

    expect(foodOperatingLoop.buildPlan).toHaveBeenCalledWith(
      'user-1',
      'recipe-1',
      50,
      'JP',
    );
  });

  it('passes nutrition filters and country into recommendations', async () => {
    foodOperatingLoop.recommend.mockResolvedValue([
      { recipeId: 'recipe-1', name: 'Chicken Bowl', score: 92 },
    ]);

    await expect(
      controller.recommendations(
        { user: { id: 'user-1' } },
        '2',
        'JP',
        '700',
        '35',
      ),
    ).resolves.toEqual([
      { recipeId: 'recipe-1', name: 'Chicken Bowl', score: 92 },
    ]);

    expect(foodOperatingLoop.recommend).toHaveBeenCalledWith(
      'user-1',
      2,
      'JP',
      700,
      35,
    );
  });
});
