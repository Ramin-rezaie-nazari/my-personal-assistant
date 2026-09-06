import { UsersService } from './users.service';

describe('UsersService onboarding persistence', () => {
  it('persists profile, preferences, onboarding state and onboarding facts atomically', async () => {
    const tx = {
      user: { update: jest.fn().mockResolvedValue({}) },
      userProfile: { upsert: jest.fn().mockResolvedValue({}) },
      userPreference: { upsert: jest.fn().mockResolvedValue({}) },
      userOnboarding: { upsert: jest.fn().mockResolvedValue({}) },
      userFact: { upsert: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<void>) => callback(tx)),
    } as any;

    const service = new UsersService(prisma);
    const input = {
      fullName: 'Ramin Nazari',
      gender: 'female' as const,
      birthDate: '1990-01-15T00:00:00.000Z',
      heightCm: 172,
      weightKg: 68,
      goal: 'body_sculpt' as const,
      fitnessLevel: 'foundation' as const,
      diet: 'balanced' as const,
      workoutPlace: 'both' as const,
      trainingDaysPerWeek: 4 as const,
      equipment: 'home' as const,
      sessionMinutes: 45 as const,
      detectedCountry: 'Azerbaijan',
      notificationsEnabled: true,
      locationPermissionGranted: true,
      cameraPermissionGranted: false,
      microphonePermissionGranted: true,
    };

    const result = await service.saveOnboarding('user-1', input);

    expect(result.completed).toBe(true);
    expect(tx.userProfile.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user-1' },
      create: expect.objectContaining({
        gender: 'female',
        primaryGoal: 'body_sculpt',
        heightCm: 172,
        weightKg: 68,
      }),
      update: expect.objectContaining({
        gender: 'female',
        primaryGoal: 'body_sculpt',
      }),
    }));
    expect(tx.userPreference.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user-1' },
      create: expect.objectContaining({
        onboardingCompleted: true,
        notificationsEnabled: true,
        theme: 'feminine',
      }),
    }));
    expect(tx.userOnboarding.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user-1' },
      create: expect.objectContaining({
        completed: true,
        currentStep: 'complete',
      }),
    }));
    expect(tx.userFact.upsert).toHaveBeenCalledTimes(10);
    expect(tx.userFact.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId_key: { userId: 'user-1', key: 'onboarding.fitnessLevel' } },
      create: expect.objectContaining({ value: 'foundation', source: 'onboarding', confidence: 1 }),
    }));
  });
});
