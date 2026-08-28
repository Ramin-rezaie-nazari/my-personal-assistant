import { UserContextService } from './user-context.service';

describe('UserContextService', () => {
  it('hydrates stable profile and preferences from structured user data', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ firstName: 'Ramin', lastName: 'Test' }),
      },
      userProfile: {
        findUnique: jest.fn().mockResolvedValue({
          birthDate: new Date('1990-08-24T00:00:00.000Z'),
          gender: 'male',
          heightCm: 180,
          weightKg: 82,
          primaryGoal: 'fat loss',
        }),
      },
      healthProfile: {
        findUnique: jest.fn().mockResolvedValue({
          age: 35,
          gender: 'male',
          heightCm: 180,
          weightKg: 82,
          activityLevel: 'moderate',
          targetWeightKg: 76,
        }),
      },
      nutritionProfile: {
        findUnique: jest.fn().mockResolvedValue({
          dietType: 'vegetarian',
          dailyCaloriesGoal: 2100,
          proteinGoalGrams: 130,
          waterGoalMl: 2500,
        }),
      },
      assistantProfile: {
        findUnique: jest.fn().mockResolvedValue({
          healthGoal: 'fat loss',
          fitnessGoal: 'strength',
          nutritionGoal: 'high protein',
          waterGoalMl: 2500,
          sleepGoalHours: 8,
          exerciseGoal: '3 workouts/week',
        }),
      },
      userSettings: {
        findUnique: jest.fn().mockResolvedValue({ language: 'fa', timezone: 'Asia/Tehran' }),
      },
      userPreference: {
        findUnique: jest.fn().mockResolvedValue({
          onboardingCompleted: true,
          notificationsEnabled: true,
          reminderEnabled: true,
          theme: 'system',
        }),
      },
    } as never;

    const service = new UserContextService(prisma);
    const result = await service.build({
      userId: 'user-1',
      context: { timestamp: new Date().toISOString(), source: 'test' },
      goals: [],
      memories: [{ content: 'loves rice dishes', score: 0.9 }],
    });

    expect(result.userId).toBe('user-1');
    expect(result.profile.gender).toBe('male');
    expect(result.profile.heightCm).toBe(180);
    expect(result.profile.weightKg).toBe(82);
    expect(result.profile.activityLevel).toBe('moderate');
    expect(result.preferences.language).toBe('fa');
    expect(result.preferences.dietType).toBe('vegetarian');
    expect(result.preferences.dailyCaloriesGoal).toBe(2100);
    expect(result.constraints).toEqual(
      expect.arrayContaining([
        'diet:vegetarian',
        'health-goal:fat loss',
        'exercise-goal:3 workouts/week',
      ]),
    );
    expect(result.knownFacts).toEqual(['loves rice dishes']);
    expect(result.lifeAreas).toEqual(
      expect.arrayContaining(['nutrition', 'health', 'fitness', 'daily-life']),
    );
  });

  it('uses health age when birth date is missing', async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      userProfile: { findUnique: jest.fn().mockResolvedValue({ birthDate: null }) },
      healthProfile: {
        findUnique: jest.fn().mockResolvedValue({ age: 41 }),
      },
      nutritionProfile: { findUnique: jest.fn().mockResolvedValue(null) },
      assistantProfile: { findUnique: jest.fn().mockResolvedValue(null) },
      userSettings: { findUnique: jest.fn().mockResolvedValue(null) },
      userPreference: { findUnique: jest.fn().mockResolvedValue(null) },
    } as never;

    const service = new UserContextService(prisma);
    const result = await service.build({
      userId: 'user-2',
      context: { timestamp: new Date().toISOString(), source: 'test' },
      goals: [],
      memories: [],
    });

    expect(result.profile.age).toBe(41);
  });
});
