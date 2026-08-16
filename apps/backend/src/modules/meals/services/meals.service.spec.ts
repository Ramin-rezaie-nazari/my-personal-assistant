import { MealsService } from './meals.service';

describe('MealsService', () => {
  const tx = {
    foodItem: { findMany: jest.fn() },
    meal: { create: jest.fn() },
    dailyLog: { upsert: jest.fn() },
  };

  const prisma = {
    meal: { findMany: jest.fn() },
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  };

  let service: MealsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MealsService(prisma as never);
    tx.foodItem.findMany.mockResolvedValue([]);
    tx.meal.create.mockResolvedValue({ id: 'meal-1' });
    tx.dailyLog.upsert.mockResolvedValue({});
  });

  it('rejects empty meals', async () => {
    await expect(
      service.create('user-1', {
        name: 'Lunch',
        type: 'lunch',
        eatenAt: '2026-08-11T12:00:00.000Z',
        items: [],
      }),
    ).rejects.toThrow('A meal must contain at least one food item');
  });

  it('rejects blank labels, invalid time, and non-positive quantities', async () => {
    await expect(
      service.create('user-1', {
        name: ' ',
        type: 'lunch',
        eatenAt: '2026-08-11T12:00:00.000Z',
        items: [{ foodId: 'food-1', quantity: 1 }],
      }),
    ).rejects.toThrow('name must not be empty');

    await expect(
      service.create('user-1', {
        name: 'Lunch',
        type: 'lunch',
        eatenAt: 'not-a-date',
        items: [{ foodId: 'food-1', quantity: 1 }],
      }),
    ).rejects.toThrow('eatenAt must be a valid date-time');

    await expect(
      service.create('user-1', {
        name: 'Lunch',
        type: 'lunch',
        eatenAt: '2026-08-11T12:00:00.000Z',
        items: [{ foodId: 'food-1', quantity: 0 }],
      }),
    ).rejects.toThrow('quantity must be a finite number greater than zero');
  });

  it('calculates meal nutrition and updates the daily aggregate', async () => {
    tx.foodItem.findMany.mockResolvedValue([
      {
        id: 'food-1',
        userId: null,
        calories: 300,
        protein: 20,
        carbs: 30,
        fat: 10,
      },
    ]);

    await service.create('user-1', {
      name: 'Lunch',
      type: 'lunch',
      eatenAt: '2026-08-11T12:00:00.000Z',
      dateKey: '2026-08-11',
      items: [{ foodId: 'food-1', quantity: 2 }],
    });

    expect(tx.meal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          calories: 600,
          protein: 40,
          carbs: 60,
          fat: 20,
          items: {
            create: [
              {
                foodId: 'food-1',
                quantity: 2,
                calories: 600,
                protein: 40,
                carbs: 60,
                fat: 20,
              },
            ],
          },
        }),
      }),
    );

    expect(tx.dailyLog.upsert).toHaveBeenCalledWith({
      where: { userId_dateKey: { userId: 'user-1', dateKey: '2026-08-11' } },
      update: {
        calories: { increment: 600 },
        protein: { increment: 40 },
      },
      create: {
        userId: 'user-1',
        dateKey: '2026-08-11',
        calories: 600,
        protein: 40,
      },
    });
  });
});
