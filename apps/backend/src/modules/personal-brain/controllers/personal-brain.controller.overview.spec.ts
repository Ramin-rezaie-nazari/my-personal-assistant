import { PersonalBrainController } from './personal-brain.controller';

describe('PersonalBrainController overview', () => {
  it('aggregates the core MVP home payload for one user', async () => {
    const controller = Object.create(
      PersonalBrainController.prototype,
    ) as PersonalBrainController & Record<string, any>;
    (controller as any).smartPlanningService = {
      getPlan: jest.fn().mockResolvedValue({ bestAction: { id: 'task-1' } }),
    };
    (controller as any).nextBestActionService = {
      get: jest.fn().mockResolvedValue({ id: 'task-1' }),
    };
    (controller as any).proactiveCoachService = {
      getNextCoach: jest.fn().mockResolvedValue({ message: 'Keep going' }),
    };
    (controller as any).scheduleHealthService = {
      evaluate: jest.fn().mockResolvedValue({ status: 'healthy' }),
    };

    const result = await controller.getOverview({
      user: { id: 'user-1' },
    } as any);

    expect(result).toEqual({
      plan: { bestAction: { id: 'task-1' } },
      nextAction: { id: 'task-1' },
      coachNext: { message: 'Keep going' },
      scheduleHealth: { status: 'healthy' },
    });
    expect(
      (controller as any).smartPlanningService.getPlan,
    ).toHaveBeenCalledWith('user-1');
    expect(
      (controller as any).nextBestActionService.get,
    ).toHaveBeenCalledWith('user-1');
    expect(
      (controller as any).proactiveCoachService.getNextCoach,
    ).toHaveBeenCalledWith('user-1');
    expect(
      (controller as any).scheduleHealthService.evaluate,
    ).toHaveBeenCalledWith('user-1');
  });
});
