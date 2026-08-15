import { BadRequestException } from '@nestjs/common';
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

  it('rejects invalid date keys before touching the database', async () => {
    await expect(service.getDailySummary('user-1', '2026-02-30')).rejects.toThrow(BadRequestException);
    expect(prisma.nutritionLog.findMany).not.toHaveBeenCalled();
  });

  it('rejects blank labels and negative or non-finite nutrition values', async () => {
    await expect(service.createLog('user-1', {
      mealType: ' ',
      title: 'Breakfast',
    })).rejects.toThrow('mealType must not be empty');

    await expect(service.createLog('user-1', {
      mealType: 'breakfast',
      title: ' ',
    })).rejects.toThrow('title must not be empty');

    await expect(service.createLog('user-1', {
      mealType: 'breakfast',
      title: 'Eggs',
      calories: -1,
    })).rejects.toThrow('calories must be a finite non-negative number');

    await expect(service.createLog('user-1', {
      mealType: 'breakfast',
      title: 'Eggs',
      protein: Number.POSITIVE_INFINITY,
    })).rejects.toThrow('protein must be a finite non-negative number');
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

  it('clamps remaining values to zero and reports over-target status', async () => {
    prisma.nutritionLog.findMany.mockResolvedValue([
      { calories: 1800, protein: 100, carbs: 40, fat: 20 },
    ]);
    prisma.nutritionProfile.findUnique.mockResolvedValue({
      dailyCaloriesGoal: 1500,
      proteinGoalGrams: 80,
      waterGoalMl: 2000,
    });
    prisma.dailyLog.findUnique.mockResolvedValue({
      calories: 1800,
      protein: 100,
      waterMl: 2400,
    });

    const summary = await service.getDailySummary('user-1', '2026-08-11');

    expect(summary.remaining).toEqual({ calories: 0, protein: 0, waterMl: 0 });
    expect(summary.status).toEqual({ calories: 'over', protein: 'over', water: 'over' });
    expect(summary.progress).toEqual({ caloriesPercent: 120, proteinPercent: 125, waterPercent: 120 });
  });

  it('returns unknown progress/status when goals are missing or invalid', async () => {
    prisma.dailyLog.findUnique.mockResolvedValue({ calories: 500, protein: 20, waterMl: 400 });
    prisma.nutritionProfile.findUnique.mockResolvedValue({
      dailyCaloriesGoal: 0,
      proteinGoalGrams: null,
      waterGoalMl: null,
    });

    const summary = await service.getDailySummary('user-1', '2026-08-11');

    expect(summary.progress).toEqual({ caloriesPercent: null, proteinPercent: null, waterPercent: null });
    expect(summary.remaining).toEqual({ calories: 0, protein: null, waterMl: null });
    expect(summary.status).toEqual({ calories: 'unknown', protein: 'unknown', water: 'unknown' });
  });
});
