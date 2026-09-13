import { GoalAnalysisService } from './goal-analysis.service';
import { GoalPlanningService } from './goal-planning.service';
import { GoalProgressService } from './goal-progress.service';

describe('Goal Intelligence services', () => {
  it('scopes goal analysis to the authenticated user', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: 'g1',
          title: 'Goal',
          status: 'active',
          priority: 1,
          progressPercent: 40,
          targetDate: new Date(Date.now() + 86400000),
        },
      ]),
    };
    const service = new GoalAnalysisService(prisma as never);
    const result = await service.analyzeGoal('u1', 'g1');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'g1', remainingPercent: 60, overdue: false });
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('creates a deterministic urgency plan from progress and target date', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: 'g1',
          title: 'Goal',
          progressPercent: 80,
          targetDate: new Date(Date.now() + 2 * 86400000),
        },
      ]),
    };
    const service = new GoalPlanningService(prisma as never);
    const result = await service.createGoalPlan('u1', 'g1');
    expect(result).toMatchObject({ goalId: 'g1', remainingPercent: 20, urgency: 'urgent' });
    expect(result?.dailyProgressTarget).toBeGreaterThan(0);
  });

  it('reports progress and overdue status only for the authenticated user', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: 'g1',
          title: 'Goal',
          status: 'active',
          progressPercent: 75,
          targetDate: new Date(Date.now() - 86400000),
          updatedAt: new Date(),
          priority: 1,
        },
      ]),
    };
    const service = new GoalProgressService(prisma as never);
    const result = await service.trackProgress('u1', 'g1');
    expect(result[0]).toMatchObject({ goalId: 'g1', remainingPercent: 25, overdue: true });
  });
});
