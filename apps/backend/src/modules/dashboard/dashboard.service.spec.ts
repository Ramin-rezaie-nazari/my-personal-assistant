import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const prisma = {
    userProfile: { findUnique: jest.fn() },
    nutritionProfile: { findUnique: jest.fn() },
    dailyLog: { findUnique: jest.fn() },
    meal: { findMany: jest.fn() },
  };

  let service: DashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DashboardService(prisma as never);
  });

  it('builds a daily summary with remaining targets', async () => {
    prisma.userProfile.findUnique.mockResolvedValue({
      gender: 'male',
      birthDate: null,
      heightCm: 180,
      weightKg: 80,
      primaryGoal: 'maintenance',
    });
    prisma.nutritionProfile.findUnique.mockResolvedValue({
      dailyCaloriesGoal: 2200,
      proteinGoalGrams: 160,
      waterGoalMl: 2500,
    });
    prisma.dailyLog.findUnique.mockResolvedValue({
      calories: 800,
      protein: 60,
      waterMl: 1000,
    });
    prisma.meal.findMany.mockResolvedValue([
      {
        id: 'meal-1',
        name: 'Lunch',
        type: 'lunch',
        eatenAt: new Date('2026-08-11T12:00:00.000Z'),
        calories: 800,
        protein: 60,
        carbs: 70,
        fat: 20,
      },
    ]);

    await expect(service.getToday('user-1', '2026-08-11')).resolves.toMatchObject({
      dateKey: '2026-08-11',
      nutrition: {
        calories: 800,
        calorieGoal: 2200,
        caloriesRemaining: 1400,
        caloriesProgress: 36,
        protein: 60,
        proteinGoal: 160,
        proteinRemaining: 100,
        proteinProgress: 38,
        waterMl: 1000,
        waterGoalMl: 2500,
        waterRemainingMl: 1500,
        waterProgress: 40,
      },
      mealCount: 1,
    });

    expect(prisma.meal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1' }),
      }),
    );
  });

  it('returns zero progress when goals are not configured', async () => {
    prisma.userProfile.findUnique.mockResolvedValue(null);
    prisma.nutritionProfile.findUnique.mockResolvedValue(null);
    prisma.dailyLog.findUnique.mockResolvedValue(null);
    prisma.meal.findMany.mockResolvedValue([]);

    await expect(service.getToday('user-1', '2026-08-11')).resolves.toMatchObject({
      nutrition: {
        calories: 0,
        calorieGoal: 0,
        caloriesRemaining: 0,
        caloriesProgress: 0,
        proteinGoal: 0,
        proteinProgress: 0,
        waterGoalMl: 0,
        waterProgress: 0,
      },
      mealCount: 0,
    });
  });
});
