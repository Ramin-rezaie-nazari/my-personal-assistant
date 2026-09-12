import { BadRequestException } from '@nestjs/common';
import { ShoppingService } from './shopping.service';

describe('ShoppingService', () => {
  const inventory = { list: jest.fn() };
  const prisma = {
    foodItem: { findFirst: jest.fn() },
    shoppingItem: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },
    recipe: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  };

  const service = new ShoppingService(inventory as never, prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('converts compatible units before merging an existing basket item', async () => {
    prisma.foodItem.findFirst.mockResolvedValue({ id: 'food-1', name: 'Flour' });
    prisma.shoppingItem.findFirst.mockResolvedValue({
      id: 'basket-1',
      quantity: 1,
      unit: 'kg',
      source: 'manual',
      priority: 'normal',
    });
    prisma.shoppingItem.update.mockResolvedValue({ id: 'basket-1', quantity: 1.5, unit: 'kg' });

    await service.addToBasket('user-1', {
      foodId: 'food-1',
      quantity: 500,
      unit: 'g',
    });

    expect(prisma.shoppingItem.update).toHaveBeenCalledWith({
      where: { id: 'basket-1' },
      data: {
        quantity: { increment: 0.5 },
        source: 'manual',
        priority: 'normal',
      },
    });
  });

  it('fails closed instead of merging incompatible units', async () => {
    prisma.foodItem.findFirst.mockResolvedValue({ id: 'food-1', name: 'Milk' });
    prisma.shoppingItem.findFirst.mockResolvedValue({
      id: 'basket-1',
      quantity: 2,
      unit: 'l',
      source: 'manual',
      priority: 'normal',
    });

    await expect(
      service.addToBasket('user-1', {
        foodId: 'food-1',
        quantity: 3,
        unit: 'piece',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.shoppingItem.update).not.toHaveBeenCalled();
  });

  it('converts recipe quantities into the existing basket unit', async () => {
    prisma.recipe.findFirst.mockResolvedValue({
      id: 'recipe-1',
      ingredients: [{ foodId: 'food-1' }],
    });

    const tx = {
      foodItem: { findFirst: jest.fn().mockResolvedValue({ name: 'Rice' }) },
      shoppingItem: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'basket-1',
          quantity: 1,
          unit: 'kg',
        }),
        update: jest.fn().mockResolvedValue({ id: 'basket-1' }),
        create: jest.fn(),
      },
    };
    prisma.$transaction.mockImplementation(async (callback: (value: typeof tx) => Promise<unknown>) => callback(tx));

    await service.addRecipeMissing('user-1', 'recipe-1', [
      { foodId: 'food-1', quantity: 250, unit: 'g' },
    ]);

    expect(tx.shoppingItem.update).toHaveBeenCalledWith({
      where: { id: 'basket-1' },
      data: {
        quantity: { increment: 0.25 },
        source: 'recipe',
        priority: 'high',
      },
    });
  });

  it('fails the recipe transaction when units are incompatible', async () => {
    prisma.recipe.findFirst.mockResolvedValue({
      id: 'recipe-1',
      ingredients: [{ foodId: 'food-1' }],
    });

    const tx = {
      foodItem: { findFirst: jest.fn().mockResolvedValue({ name: 'Egg' }) },
      shoppingItem: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'basket-1',
          quantity: 2,
          unit: 'piece',
        }),
        update: jest.fn(),
        create: jest.fn(),
      },
    };
    prisma.$transaction.mockImplementation(async (callback: (value: typeof tx) => Promise<unknown>) => callback(tx));

    await expect(
      service.addRecipeMissing('user-1', 'recipe-1', [
        { foodId: 'food-1', quantity: 500, unit: 'g' },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(tx.shoppingItem.update).not.toHaveBeenCalled();
  });
});
