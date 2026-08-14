import { DecisionExecutionController } from './decision-execution.controller';

describe('DecisionExecutionController', () => {
  it('re-resolves the authenticated user next action before execution', async () => {
    const controller = Object.create(DecisionExecutionController.prototype) as DecisionExecutionController & Record<string, any>;
    controller.nextBestAction = {
      get: jest.fn().mockResolvedValue({
        execution: {
          candidate: {
            id: 'task-1',
            domain: 'schedule',
            action: 'complete_life_task',
            score: 0.8,
            confidence: 1,
          },
        },
      }),
    };
    controller.coordinator = { execute: jest.fn().mockResolvedValue({ status: 'completed' }) };

    const result = await controller.executeNext({ user: { id: 'user-1' } } as any);

    expect(result).toEqual({ status: 'completed' });
    expect(controller.nextBestAction.get).toHaveBeenCalledWith('user-1');
    expect(controller.coordinator.execute).toHaveBeenCalledWith('user-1', {
      id: 'task-1',
      domain: 'schedule',
      action: 'complete_life_task',
      score: 0.8,
      confidence: 1,
    });
  });

  it('does not execute when the server has no current actionable candidate', async () => {
    const controller = Object.create(DecisionExecutionController.prototype) as DecisionExecutionController & Record<string, any>;
    controller.nextBestAction = { get: jest.fn().mockResolvedValue({ execution: undefined }) };
    controller.coordinator = { execute: jest.fn() };

    const result = await controller.executeNext({ user: { id: 'user-1' } } as any);

    expect(result).toEqual({ status: 'unsupported', reason: 'no_actionable_next_action' });
    expect(controller.coordinator.execute).not.toHaveBeenCalled();
  });

  it('binds confirmation execution to the authenticated user', async () => {
    const controller = Object.create(DecisionExecutionController.prototype) as DecisionExecutionController & Record<string, any>;
    controller.coordinator = { confirmAndExecute: jest.fn().mockResolvedValue({ status: 'completed' }) };

    const result = await controller.confirm({ user: { id: 'user-1' }, body: { token: 'token-1' } } as any);

    expect(result).toEqual({ status: 'completed' });
    expect(controller.coordinator.confirmAndExecute).toHaveBeenCalledWith('user-1', 'token-1');
  });
});
