import { PersonalBrainController } from './personal-brain.controller';

describe('PersonalBrainController overview', () => {
  it('aggregates the core MVP home payload for one user', async () => {
    const controller = Object.create(PersonalBrainController.prototype) as PersonalBrainController & Record<string, any>;
    controller.smartPlanningService = { getPlan: jest.fn().mockResolvedValue({ bestAction: { id: 'task-1' } }) };
    controller.nextBestActionService = { get: jest.fn().mockResolvedValue({ id: 'task-1' }) };
    controller.proactiveCoachService = { getNextCoach: jest.fn().mockResolvedValue({ message: 'Keep going' }) };
    controller.scheduleHealthService = { evaluate: jest.fn().mockResolvedValue({ status: 'healthy' }) };

    const result = await controller.getOverview({ user: { id: 'user-1' } } as any);

    expect(result).toEqual({
      plan: { bestAction: { id: 'task-1' } },
      nextAction: { id: 'task-1' },
      coachNext: { message: 'Keep going' },
      scheduleHealth: { status: 'healthy' },
    });
    expect(controller.smartPlanningService.getPlan).toHaveBeenCalledWith('user-1');
    expect(controller.nextBestActionService.get).toHaveBeenCalledWith('user-1');
    expect(controller.proactiveCoachService.getNextCoach).toHaveBeenCalledWith('user-1');
    expect(controller.scheduleHealthService.evaluate).toHaveBeenCalledWith('user-1');
  });
});
