import { SmartPlanningService } from './smart-planning.service';

describe('SmartPlanningService', () => {
  it('uses stable positive outcome evidence to prefer a task', async () => {
    const tasks = [
      {
        id: 'task-a',
        title: 'Task A',
        priority: 2,
        estimatedMinutes: 30,
        energyLevel: 'medium',
        dueAt: null,
        scheduledAt: null,
        goalId: null,
        goal: null,
        dependencies: [],
      },
      {
        id: 'task-b',
        title: 'Task B',
        priority: 2,
        estimatedMinutes: 30,
        energyLevel: 'medium',
        dueAt: null,
        scheduledAt: null,
        goalId: null,
        goal: null,
        dependencies: [],
      },
    ];
    const prisma = {
      lifeTask: { findMany: jest.fn().mockResolvedValue(tasks) },
    } as any;
    const learning = {
      buildProfile: jest.fn().mockResolvedValue({
        preferredTaskMinutes: null,
        bestHours: [],
        snoozeRate: 0,
        acceptanceRate: 0,
      }),
    } as any;
    const outcomeLearning = {
      decisionAdjustments: jest.fn().mockResolvedValue({ 'task-b': 0.04 }),
    } as any;

    const service = new SmartPlanningService(prisma, learning, outcomeLearning);
    const plan = await service.getPlan(
      'user-1',
      new Date('2026-08-14T10:00:00Z'),
    );

    expect(plan.bestAction?.id).toBe('task-b');
    expect(plan.bestAction?.reasons).toContain(
      'has a stable positive outcome history',
    );
    expect(outcomeLearning.decisionAdjustments).toHaveBeenCalledWith('user-1', [
      'task-a',
      'task-b',
    ]);
  });

  it('does not let outcome learning override a blocked task', async () => {
    const tasks = [
      {
        id: 'blocked',
        title: 'Blocked',
        priority: 1,
        estimatedMinutes: 30,
        energyLevel: 'medium',
        dueAt: null,
        scheduledAt: null,
        goalId: null,
        goal: null,
        dependencies: [{ dependsOnTask: { status: 'pending' } }],
      },
      {
        id: 'available',
        title: 'Available',
        priority: 2,
        estimatedMinutes: 30,
        energyLevel: 'medium',
        dueAt: null,
        scheduledAt: null,
        goalId: null,
        goal: null,
        dependencies: [],
      },
    ];
    const prisma = {
      lifeTask: { findMany: jest.fn().mockResolvedValue(tasks) },
    } as any;
    const learning = {
      buildProfile: jest.fn().mockResolvedValue({
        preferredTaskMinutes: null,
        bestHours: [],
        snoozeRate: 0,
        acceptanceRate: 0,
      }),
    } as any;
    const outcomeLearning = {
      decisionAdjustments: jest.fn().mockResolvedValue({ blocked: 0.04 }),
    } as any;

    const service = new SmartPlanningService(prisma, learning, outcomeLearning);
    const plan = await service.getPlan(
      'user-1',
      new Date('2026-08-14T10:00:00Z'),
    );

    expect(plan.bestAction?.id).toBe('available');
    expect(plan.blocked[0]?.id).toBe('blocked');
  });
});
