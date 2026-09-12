import { GoalProgressService } from './goal-progress.service';

describe('GoalProgressService', () => {
  it('returns user-scoped progress and overdue state', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: 'g1',
          title: 'Lose weight',
          status: 'active',
          progressPercent: 40,
          targetDate: new Date('2026-01-01T00:00:00Z'),
          updatedAt: new Date('2026-09-01T00:00:00Z'),
          priority: 1,
        },
      ]),
    } as any;
    const service = new GoalProgressService(prisma);
    const result = await service.trackProgress('u1', 'g1');
    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result[0]).toMatchObject({ goalId: 'g1', remainingPercent: 60, overdue: true });
  });
});
