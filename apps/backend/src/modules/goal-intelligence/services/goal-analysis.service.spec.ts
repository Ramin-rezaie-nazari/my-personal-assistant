import { GoalAnalysisService } from './goal-analysis.service';

describe('GoalAnalysisService', () => {
  it('adds remaining and overdue signals to active goals', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: 'goal-1',
          title: 'Build consistency',
          status: 'active',
          priority: 1,
          progressPercent: 40,
          targetDate: new Date('2026-01-01T00:00:00Z'),
        },
      ]),
    } as any;
    const service = new GoalAnalysisService(prisma);
    const result = await service.analyzeGoal('user-1');
    expect(result[0]).toMatchObject({ remainingPercent: 60, overdue: true });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });
});
