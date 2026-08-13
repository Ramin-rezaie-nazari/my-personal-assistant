import { NutritionService } from './nutrition.service';

describe('NutritionService', () => {
  const tx = {
    nutritionLog: { create: jest.fn() },
    dailyLog: { upsert: jest.fn() },
  };

  const prisma = {
    nutritionLog: { findMany: jest.fn() },
    nutritionProfile: { findUnique: jest.fn() },
    dailyLog: { findUnique: jest.fn() },
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
  };

  let service: NutritionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NutritionService(prisma as never);
    tx.nutritionLog.create.mockResolvedValue({ id: 'log-1' });
    tx.dailyLog.upsert.mockResolvedValue({});
    prisma.nutritionLog.findMany.mockResolvedValue([]);
    prisma.nutritionProfile.findUnique.mockResolvedValue(null);
    prisma.dailyLog.findUnique.mockResolvedValue(null);
  });

  it('filters logs by calendar day', async () => {
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

  it('builds a goal-aware daily summary from logged nutrition and daily totals', async () => {
    prisma.nutritionLog.findMany.mockResolvedValue([
      { calories: 500, protein: 30, carbs: 50, fat: 15 },
      { calories: 500, protein: 30, carbs: 25, fat: 10 },
    ]);
    prisma.nutritionProfile.findUnique.mockResolvedValue({
      dailyCaloriesGoal: 1500,
      proteinGoalGrams: 80,
      waterGoalMl: 2000,
    });
    prisma.dailyLog.findUnique.mockResolvedValue({
      calories: 1000,
      protein: 60,
      waterMl: 1200,
    });

    const summary = await service.getDailySummary('user-1', '2026-08-11');

    expect(summary).toEqual({
      dateKey: '2026-08-11',
      meals: {
        count: 2,
        calories: 1000,
        protein: 60,
        carbs: 75,
        fat: 25,
      },
      goals: { calories: 1500, protein: 80, waterMl: 2000 },
      remaining: { calories: 500, protein: 20, waterMl: 800 },
      progress: {
        caloriesPercent: 66.67,
        proteinPercent: 75,
        waterPercent: 60,
      },
      status: { calories: 'under', protein: 'under', water: 'under' },
    });
  });
});
