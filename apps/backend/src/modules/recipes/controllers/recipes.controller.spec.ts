import { BadRequestException } from '@nestjs/common';
import { RecipesController } from './recipes.controller';

describe('RecipesController scaling endpoint', () => {
  const recipesService = {
    getScaledRecipe: jest.fn(),
  };
  const matcher = {
    match: jest.fn(),
  };
  const controller = new RecipesController(recipesService as never, matcher as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires the target serving count', async () => {
    expect(() =>
      controller.scale({ user: { id: 'user-1' } }, 'recipe-1', undefined),
    ).toThrow(BadRequestException);

    expect(() =>
      controller.scale({ user: { id: 'user-1' } }, 'recipe-1', 'abc'),
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
});
