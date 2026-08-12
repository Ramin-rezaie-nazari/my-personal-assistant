import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const prisma = {
    userProfile: { findUnique: jest.fn() },
    nutritionProfile: { findUnique: jest.fn() },
    dailyLog: { findUnique: jest.fn(), findMany: jest.fn() },
    meal: { findMany: jest.fn() },
    workout: { findMany: jest.fn(), findFirst: jest.fn() },
  };

  let service: DashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DashboardService(prisma as never);
  });

  function mockToday() {
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
    prisma.meal.findMany.mockResolvedValue([]);
  }

  it('builds a daily summary with remaining targets', async () => {
    mockToday();
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

  it('aggregates a seven-day command center view with workout analytics', async () => {
    mockToday();
    prisma.dailyLog.findMany.mockResolvedValue([
      { dateKey: '2026-08-06', calories: 2000, protein: 140, waterMl: 2200 },
      { dateKey: '2026-08-07', calories: 2100, protein: 150, waterMl: 2300 },
      { dateKey: '2026-08-08', calories: 2050, protein: 155, waterMl: 2400 },
      { dateKey: '2026-08-09', calories: 2200, protein: 160, waterMl: 2500 },
      { dateKey: '2026-08-10', calories: 2150, protein: 150, waterMl: 2400 },
      { dateKey: '2026-08-11', calories: 800, protein: 60, waterMl: 1000 },
    ]);
    prisma.workout.findMany.mockResolvedValue([
      {
        id: 'w-2',
        name: 'Upper Body',
        type: 'strength',
        durationMinutes: 50,
        caloriesBurned: 340,
        performedAt: new Date('2026-08-11T18:00:00.000Z'),
      },
      {
        id: 'w-1',
        name: 'Walk',
        type: 'cardio',
        durationMinutes: 30,
        caloriesBurned: 180,
        performedAt: new Date('2026-08-09T09:00:00.000Z'),
      },
    ]);
    prisma.workout.findFirst.mockResolvedValue({
      id: 'w-2',
      name: 'Upper Body',
      type: 'strength',
      durationMinutes: 50,
      caloriesBurned: 340,
      performedAt: new Date('2026-08-11T18:00:00.000Z'),
    });

    await expect(service.getOverview('user-1', '2026-08-11')).resolves.toMatchObject({
      range: { startKey: '2026-08-05', endKey: '2026-08-11' },
      weekly: {
        loggedDays: 6,
        consistencyPercent: 86,
        totalCalories: 11300,
        totalProtein: 815,
        totalWaterMl: 13800,
        averageCalories: 1883,
        currentStreak: 2,
      },
      workouts: {
        count: 2,
        activeDays: 2,
        totalMinutes: 80,
        totalCaloriesBurned: 520,
        latest: { id: 'w-2', name: 'Upper Body' },
      },
    });
  });
});
