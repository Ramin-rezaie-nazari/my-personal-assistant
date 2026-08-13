import { NutritionService } from './nutrition.service';

describe('NutritionService', () => {
  it('summarizes the daily nutrition state from logs and goals', async () => {
    const prisma = {
      nutritionLog: { findMany: jest.fn() },
      nutritionProfile: { findUnique: jest.fn() },
      dailyLog: { findUnique: jest.fn(), upsert: jest.fn() },
      $transaction: jest.fn(),
    };

    prisma.nutritionLog.findMany.mockResolvedValue([
      { id: 'm2', mealType: 'dinner', title: 'Chicken', calories: 700, protein: 60, carbs: 30, fat: 20, dateKey: '2026-08-13' },
      { id: 'm1', mealType: 'lunch', title: 'Rice', calories: 500, protein: 15, carbs: 90, fat: 8, dateKey: '2026-08-13' },
    ]);
    prisma.nutritionProfile.findUnique.mockResolvedValue({ dailyCaloriesGoal: 2200, proteinGoalGrams: 140, waterGoalMl: 2400 });
    prisma.dailyLog.findUnique.mockResolvedValue({ calories: 1200, protein: 75, waterMl: 1500 });

    const service = new NutritionService(prisma as never);
    const result = await service.getDailySummary('u1', '2026-08-13');

    expect(result).toEqual({
      dateKey: '2026-08-13',
      meals: { count: 2, calories: 1200, protein: 75, carbs: 120, fat: 28 },
      goals: { calories: 2200, protein: 140, waterMl: 2400 },
      remaining: { calories: 1000, protein: 65, waterMl: 900 },
      progress: { caloriesPercent: 54.55, proteinPercent: 53.57, waterPercent: 62.5 },
      status: { calories: 'under', protein: 'under', water: 'under' },
    });
  });
});
