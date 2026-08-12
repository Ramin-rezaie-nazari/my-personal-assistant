import { PrismaService } from '../../../common/database/prisma.service';

import { BrainGoalService } from './brain-goal.service';

describe('BrainGoalService', () => {
  it('loads the authenticated user primary goal from the user profile', async () => {
    const findUnique = jest.fn().mockResolvedValue({
      primaryGoal: 'Lose 5 kg',
    });

    const prisma = {
      userProfile: {
        findUnique,
      },
    } as unknown as PrismaService;

    const service = new BrainGoalService(prisma);

    await expect(service.getGoals('user-123')).resolves.toEqual([
      {
        category: 'general',
        title: 'Lose 5 kg',
        priority: 1,
        metadata: {
          source: 'user-profile',
          sourceField: 'primaryGoal',
        },
      },
    ]);

    expect(findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      select: { primaryGoal: true },
    });
  });

  it('returns no goals when the user has no primary goal', async () => {
    const findUnique = jest.fn().mockResolvedValue({ primaryGoal: '  ' });
    const prisma = {
      userProfile: { findUnique },
    } as unknown as PrismaService;

    const service = new BrainGoalService(prisma);

    await expect(service.getGoals('user-123')).resolves.toEqual([]);
  });
});
