import { PersonalizationService } from './personalization.service';

describe('PersonalizationService', () => {
  const prisma = {
    userProfile: { findUnique: jest.fn() },
    nutritionProfile: { findUnique: jest.fn() },
    nutritionLog: { findMany: jest.fn() },
  };

  const service = new PersonalizationService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('builds compact food context from profile, nutrition goals and recent logs', async () => {
    prisma.userProfile.findUnique.mockResolvedValue({ primaryGoal: 'fat_loss' });
    prisma.nutritionProfile.findUnique.mockResolvedValue({
      dailyCaloriesGoal: 1800,
      proteinGoalGrams: 120,
      dietType: 'balanced',
    });
    prisma.nutritionLog.findMany.mockResolvedValue([
      { title: 'Chicken Bowl' },
      { title: 'Lentil Soup' },
    ]);

    await expect(service.buildFoodContext('u1')).resolves.toEqual({
      calorieLimit: 810,
      proteinFloor: 36,
      dietType: 'balanced',
      primaryGoal: 'fat_loss',
      recentMealTitles: ['Chicken Bowl', 'Lentil Soup'],
    });
  });
});
