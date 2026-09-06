import { NotFoundException } from '@nestjs/common';
import { ShoppingService } from './shopping.service';

describe('ShoppingService authorization boundaries', () => {
  const prisma = {
    foodItem: {
      findFirst: jest.fn(),
    },
    shoppingItem: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    recipe: {
      findFirst: jest.fn(),
    },
  } as any;

  const inventory = {
    list: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not allow adding another user\'s food to the current user\'s basket', async () => {
    prisma.foodItem.findFirst.mockResolvedValue(null);
    const service = new ShoppingService(inventory, prisma);

    await expect(
      service.addToBasket('user-a', {
        foodId: 'food-owned-by-user-b',
        quantity: 1,
        unit: 'piece',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.foodItem.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'food-owned-by-user-b',
        OR: [{ userId: null }, { userId: 'user-a' }],
      },
    });
    expect(prisma.shoppingItem.create).not.toHaveBeenCalled();
  });

  it('does not allow using another user\'s recipe as a shopping source', async () => {
    prisma.recipe.findFirst.mockResolvedValue(null);
    const service = new ShoppingService(inventory, prisma);

    await expect(
      service.addRecipeMissing('user-a', 'recipe-owned-by-user-b', [
        { foodId: 'food-1', quantity: 1, unit: 'piece' },
      ]),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.recipe.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'recipe-owned-by-user-b',
        OR: [{ userId: null }, { userId: 'user-a' }],
      },
      include: { ingredients: true },
    });
  });
});
