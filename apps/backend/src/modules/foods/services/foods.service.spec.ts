import { FoodsService } from './foods.service';

describe('FoodsService', () => {
  const prisma = {
    foodItem: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  let service: FoodsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FoodsService(prisma as never);
    prisma.foodItem.findMany.mockResolvedValue([]);
    prisma.foodItem.create.mockResolvedValue({ id: 'food-1' });
  });

  it('normalizes search text before filtering', async () => {
    await service.findAll('user-1', '  chicken  ');

    expect(prisma.foodItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { OR: [{ userId: null }, { userId: 'user-1' }] },
            {
              OR: [
                { name: { contains: 'chicken', mode: 'insensitive' } },
                { category: { contains: 'chicken', mode: 'insensitive' } },
              ],
            },
          ],
        },
        orderBy: { name: 'asc' },
      }),
    );
  });

  it('rejects blank names/categories and invalid nutrition values', async () => {
    await expect(
      service.create('user-1', {
        name: ' ',
        category: 'protein',
      }),
    ).rejects.toThrow('name must not be empty');

    await expect(
      service.create('user-1', {
        name: 'Chicken',
        category: ' ',
      }),
    ).rejects.toThrow('category must not be empty');

    await expect(
      service.create('user-1', {
        name: 'Chicken',
        category: 'protein',
        calories: -1,
      }),
    ).rejects.toThrow('calories must be a finite non-negative number');

    expect(prisma.foodItem.create).not.toHaveBeenCalled();
  });

  it('creates user-owned, unverified food entries', async () => {
    await service.create('user-1', {
      name: 'Chicken breast',
      category: 'protein',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
    });

    expect(prisma.foodItem.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        name: 'Chicken breast',
        category: 'protein',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        verified: false,
      },
    });
  });
});
