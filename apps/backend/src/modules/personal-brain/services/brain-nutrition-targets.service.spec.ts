import { BrainNutritionTargetsService } from './brain-nutrition-targets.service';
import { PrismaService } from '../../../common/database/prisma.service';

describe('BrainNutritionTargetsService', () => {
  it('maps the authenticated user nutrition profile into brain targets', async () => {
    const prisma = {
      nutritionProfile: {
        findUnique: jest.fn().mockResolvedValue({
          dailyCaloriesGoal: 2000,
          proteinGoalGrams: 120,
          waterGoalMl: 2500,
        }),
      },
    } as unknown as PrismaService;

    const service = new BrainNutritionTargetsService(prisma);

    await expect(service.getTargets('user-1')).resolves.toEqual({
      hasTargets: true,
      dailyCaloriesGoal: 2000,
      proteinGoalGrams: 120,
      waterGoalMl: 2500,
    });

    expect(prisma.nutritionProfile.findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
  });

  it('returns an empty target context when no nutrition profile exists', async () => {
    const prisma = {
      nutritionProfile: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;

    const service = new BrainNutritionTargetsService(prisma);

    await expect(service.getTargets('user-2')).resolves.toEqual({
      hasTargets: false,
      dailyCaloriesGoal: undefined,
      proteinGoalGrams: undefined,
      waterGoalMl: undefined,
    });
  });
});
