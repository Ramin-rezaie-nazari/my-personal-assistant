import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AddShoppingFromRecipeDto } from './add-shopping-from-recipe.dto';
import { AddShoppingItemDto } from './add-shopping-item.dto';

describe('Shopping request DTOs', () => {
  it('rejects non-positive and non-numeric basket quantities', async () => {
    const zero = plainToInstance(AddShoppingItemDto, {
      foodId: 'food-1',
      quantity: 0,
      unit: 'g',
    });
    const nan = plainToInstance(AddShoppingItemDto, {
      foodId: 'food-1',
      quantity: 'not-a-number',
      unit: 'g',
    });
    expect(await validate(zero)).not.toHaveLength(0);
    expect(await validate(nan)).not.toHaveLength(0);
  });

  it('validates nested recipe shopping items', async () => {
    const invalid = plainToInstance(AddShoppingFromRecipeDto, {
      recipeId: 'recipe-1',
      items: [{ foodId: 'food-1', quantity: 0, unit: '' }],
    });
    const errors = await validate(invalid);
    expect(errors).not.toHaveLength(0);
  });
});
