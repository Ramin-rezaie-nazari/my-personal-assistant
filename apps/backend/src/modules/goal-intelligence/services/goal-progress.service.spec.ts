import { GoalProgressService } from './goal-progress.service';

describe('GoalProgressService', () => {
  it('returns user-scoped progress and overdue state', async () => {
    const prisma = {
      goal: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'g1',
            title: 'Lose weight',
            status: 'active',
            progressPercent: 40,
            targetDate: new Date('2026-01-01T00:00:00Z'),
            updatedAt: new Date('2026-09-01T00:00:00Z'),
          },
        ]),
      },
    } as any;
    const service = new GoalProgressService(prisma);
    const result = await service.trackProgress('u1', 'g1');
    expect(prisma.goal.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'g1', userId: 'u1' } }));
    expect(result[0]).toMatchObject({ goalId: 'g1', remainingPercent: 60, overdue: true });
  });
});
