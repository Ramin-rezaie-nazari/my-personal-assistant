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
    inventoryItem: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
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
      id: 'basket-1', quantity: 1, unit: 'kg', source: 'manual', priority: 'normal',
    });
    prisma.shoppingItem.update.mockResolvedValue({ id: 'basket-1', quantity: 1.5, unit: 'kg' });
    await service.addToBasket('user-1', { foodId: 'food-1', quantity: 500, unit: 'g' });
    expect(prisma.shoppingItem.update).toHaveBeenCalledWith({
      where: { id: 'basket-1' },
      data: { quantity: { increment: 0.5 }, source: 'manual', priority: 'normal' },
    });
  });

  it('fails closed instead of merging incompatible units', async () => {
    prisma.foodItem.findFirst.mockResolvedValue({ id: 'food-1', name: 'Milk' });
    prisma.shoppingItem.findFirst.mockResolvedValue({
      id: 'basket-1', quantity: 2, unit: 'l', source: 'manual', priority: 'normal',
    });
    await expect(service.addToBasket('user-1', { foodId: 'food-1', quantity: 3, unit: 'piece' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.shoppingItem.update).not.toHaveBeenCalled();
  });

  it('rejects invalid basket quantity as a bad request', async () => {
    await expect(service.addToBasket('user-1', { foodId: 'food-1', quantity: 0, unit: 'g' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.addToBasket('user-1', { foodId: 'food-1', quantity: Number.NaN, unit: 'g' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.foodItem.findFirst).not.toHaveBeenCalled();
  });

  it('converts recipe quantities into the existing basket unit', async () => {
    prisma.recipe.findFirst.mockResolvedValue({ id: 'recipe-1', ingredients: [{ foodId: 'food-1' }] });
    const tx = {
      foodItem: { findFirst: jest.fn().mockResolvedValue({ name: 'Rice' }) },
      shoppingItem: {
        findUnique: jest.fn().mockResolvedValue({ id: 'basket-1', quantity: 1, unit: 'kg' }),
        update: jest.fn().mockResolvedValue({ id: 'basket-1' }),
        create: jest.fn(),
      },
    };
    prisma.$transaction.mockImplementation(async (callback: (value: typeof tx) => Promise<unknown>) => callback(tx));
    await service.addRecipeMissing('user-1', 'recipe-1', [{ foodId: 'food-1', quantity: 250, unit: 'g' }]);
    expect(tx.shoppingItem.update).toHaveBeenCalledWith({
      where: { id: 'basket-1' },
      data: { quantity: { increment: 0.25 }, source: 'recipe', priority: 'high' },
    });
  });

  it('fails the recipe transaction when units are incompatible', async () => {
    prisma.recipe.findFirst.mockResolvedValue({ id: 'recipe-1', ingredients: [{ foodId: 'food-1' }] });
    const tx = {
      foodItem: { findFirst: jest.fn().mockResolvedValue({ name: 'Egg' }) },
      shoppingItem: {
        findUnique: jest.fn().mockResolvedValue({ id: 'basket-1', quantity: 2, unit: 'piece' }),
        update: jest.fn(),
        create: jest.fn(),
      },
    };
    prisma.$transaction.mockImplementation(async (callback: (value: typeof tx) => Promise<unknown>) => callback(tx));
    await expect(service.addRecipeMissing('user-1', 'recipe-1', [{ foodId: 'food-1', quantity: 500, unit: 'g' }])).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.shoppingItem.update).not.toHaveBeenCalled();
  });

  it('marks a purchased basket item complete and adds its quantity to inventory', async () => {
    const tx = {
      shoppingItem: {
        findFirst: jest.fn().mockResolvedValue({ id: 'basket-1', userId: 'user-1', foodId: 'food-1', quantity: 500, unit: 'g', completed: false }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      inventoryItem: {
        findUnique: jest.fn().mockResolvedValue({ id: 'inventory-1', userId: 'user-1', foodId: 'food-1', quantity: 1, unit: 'kg' }),
        update: jest.fn().mockResolvedValue({ id: 'inventory-1', quantity: 1.5, unit: 'kg' }),
        create: jest.fn(),
      },
    };
    prisma.$transaction.mockImplementation(async (callback: (value: typeof tx) => Promise<unknown>) => callback(tx));
    await expect(service.complete('user-1', 'basket-1')).resolves.toEqual({ count: 1, inventorySynced: true });
    expect(tx.shoppingItem.updateMany).toHaveBeenCalledWith({ where: { id: 'basket-1', userId: 'user-1', completed: false }, data: { completed: true } });
    expect(tx.inventoryItem.update).toHaveBeenCalledWith({ where: { id: 'inventory-1' }, data: { quantity: { increment: 0.5 } } });
  });

  it('fails closed and rolls back when purchased and inventory units are incompatible', async () => {
    const tx = {
      shoppingItem: {
        findFirst: jest.fn().mockResolvedValue({ id: 'basket-1', userId: 'user-1', foodId: 'food-1', quantity: 2, unit: 'piece', completed: false }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      inventoryItem: {
        findUnique: jest.fn().mockResolvedValue({ id: 'inventory-1', userId: 'user-1', foodId: 'food-1', quantity: 2, unit: 'kg' }),
        update: jest.fn(),
        create: jest.fn(),
      },
    };
    prisma.$transaction.mockImplementation(async (callback: (value: typeof tx) => Promise<unknown>) => callback(tx));
    await expect(service.complete('user-1', 'basket-1')).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.shoppingItem.updateMany).toHaveBeenCalled();
    expect(tx.inventoryItem.update).not.toHaveBeenCalled();
  });

  it('creates a new inventory item when a purchased food is not tracked yet', async () => {
    const tx = {
      shoppingItem: {
        findFirst: jest.fn().mockResolvedValue({ id: 'basket-1', userId: 'user-1', foodId: 'food-1', quantity: 3, unit: 'piece', completed: false }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      inventoryItem: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 'inventory-1' }),
      },
    };
    prisma.$transaction.mockImplementation(async (callback: (value: typeof tx) => Promise<unknown>) => callback(tx));
    await expect(service.complete('user-1', 'basket-1')).resolves.toEqual({ count: 1, inventorySynced: true });
    expect(tx.inventoryItem.create).toHaveBeenCalledWith({ data: { userId: 'user-1', foodId: 'food-1', quantity: 3, unit: 'piece' } });
  });
});
