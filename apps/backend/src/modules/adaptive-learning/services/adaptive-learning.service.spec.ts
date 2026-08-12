import { AdaptiveLearningService } from './adaptive-learning.service';

describe('AdaptiveLearningService', () => {
  const prisma = {
    userProfile: { findUnique: jest.fn() },
    nutritionProfile: { findUnique: jest.fn() },
    dailyLog: { findMany: jest.fn() },
    workout: { findMany: jest.fn() },
    meal: { findMany: jest.fn() },
  };

  let service: AdaptiveLearningService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdaptiveLearningService(prisma as never);
    prisma.userProfile.findUnique.mockResolvedValue({ primaryGoal: 'fat loss' });
    prisma.nutritionProfile.findUnique.mockResolvedValue({
      dailyCaloriesGoal: 2200,
      proteinGoalGrams: 160,
      waterGoalMl: 2500,
    });
    prisma.dailyLog.findMany.mockResolvedValue([
      { dateKey: '2026-08-06', calories: 2300, protein: 130, waterMl: 1400 },
      { dateKey: '2026-08-07', calories: 2250, protein: 135, waterMl: 1500 },
      { dateKey: '2026-08-08', calories: 2400, protein: 120, waterMl: 1600 },
      { dateKey: '2026-08-09', calories: 2100, protein: 150, waterMl: 1800 },
      { dateKey: '2026-08-10', calories: 2200, protein: 145, waterMl: 1700 },
    ]);
    prisma.workout.findMany.mockResolvedValue([
      { performedAt: new Date('2026-08-11T08:00:00Z'), durationMinutes: 40, caloriesBurned: 280 },
      { performedAt: new Date('2026-08-09T08:00:00Z'), durationMinutes: 30, caloriesBurned: 190 },
      { performedAt: new Date('2026-08-07T08:00:00Z'), durationMinutes: 25, caloriesBurned: 160 },
    ]);
    prisma.meal.findMany.mockResolvedValue([
      { name: 'Chicken Bowl', calories: 620, protein: 42, eatenAt: new Date('2026-08-11T13:00:00Z') },
    ]);
  });

  it('generates ranked, user-scoped insights from seven days of activity', async () => {
    const result = await service.getInsights('user-1', '2026-08-12');

    expect(result.profileGoal).toBe('fat loss');
    expect(result.insights.length).toBeGreaterThan(2);
    expect(result.insights[0].key).toBe('hydration-gap');
    expect(result.insights.some((item) => item.key === 'protein-gap')).toBe(true);
    expect(result.insights.some((item) => item.key === 'training-consistency')).toBe(true);
    expect(prisma.dailyLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1' }) }),
    );
    expect(prisma.workout.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1' }) }),
    );
    expect(prisma.meal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1' }) }),
    );
  });

  it('returns a useful cold-start insight when there is no history', async () => {
    prisma.dailyLog.findMany.mockResolvedValue([]);
    prisma.workout.findMany.mockResolvedValue([]);
    prisma.meal.findMany.mockResolvedValue([]);

    const result = await service.getInsights('user-2', '2026-08-12');

    expect(result.insights[0]).toEqual(
      expect.objectContaining({
        key: 'start-tracking',
        category: 'consistency',
      }),
    );
  });
});
