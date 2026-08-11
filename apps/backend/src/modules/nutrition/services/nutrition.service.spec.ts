import { NutritionService } from './nutrition.service';

describe('NutritionService', () => {
  const tx = {
    nutritionLog: { create: jest.fn() },
    dailyLog: { upsert: jest.fn() },
  };

  const prisma = {
    nutritionLog: { findMany: jest.fn() },
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
  };

  let service: NutritionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NutritionService(prisma as never);
    tx.nutritionLog.create.mockResolvedValue({ id: 'log-1' });
    tx.dailyLog.upsert.mockResolvedValue({});
  });

  it('filters logs by calendar day', async () => {
    prisma.nutritionLog.findMany.mockResolvedValue([]);

    await service.getLogs('user-1', '2026-08-11');

    expect(prisma.nutritionLog.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', dateKey: '2026-08-11' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('creates a nutrition log and updates daily totals atomically', async () => {
    await service.createLog('user-1', {
      dateKey: '2026-08-11',
      mealType: 'lunch',
      title: 'Chicken and rice',
      calories: 650,
      protein: 45,
    });

    expect(tx.nutritionLog.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        dateKey: '2026-08-11',
        mealType: 'lunch',
        title: 'Chicken and rice',
        calories: 650,
        protein: 45,
      },
    });

    expect(tx.dailyLog.upsert).toHaveBeenCalledWith({
      where: { userId_dateKey: { userId: 'user-1', dateKey: '2026-08-11' } },
      update: {
        calories: { increment: 650 },
        protein: { increment: 45 },
      },
      create: {
        userId: 'user-1',
        dateKey: '2026-08-11',
        calories: 650,
        protein: 45,
      },
    });
  });
});
