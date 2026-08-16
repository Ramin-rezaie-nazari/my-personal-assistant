import { DecisionExecutionController } from './decision-execution.controller';

describe('DecisionExecutionController', () => {
  const nextBestAction = {
    get: jest.fn(),
  };

  const coordinator = {
    execute: jest.fn(),
    confirmAndExecute: jest.fn(),
  };

  let controller: DecisionExecutionController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new DecisionExecutionController(
      nextBestAction as any,
      coordinator as any,
    );
  });

  it('re-resolves the authenticated user next action before execution', async () => {
    nextBestAction.get.mockResolvedValue({
      execution: {
        candidate: {
          id: 'task-1',
          domain: 'schedule',
          action: 'complete_life_task',
          score: 0.8,
          confidence: 1,
        },
      },
    });

    coordinator.execute.mockResolvedValue({ status: 'completed' });

    const result = await controller.executeNext({
      user: { id: 'user-1' },
    } as any);

    expect(result).toEqual({ status: 'completed' });
    expect(nextBestAction.get).toHaveBeenCalledWith('user-1');
    expect(coordinator.execute).toHaveBeenCalledWith('user-1', {
      id: 'task-1',
      domain: 'schedule',
      action: 'complete_life_task',
      score: 0.8,
      confidence: 1,
    });
  });

  it('does not execute when the server has no current actionable candidate', async () => {
    nextBestAction.get.mockResolvedValue({ execution: undefined });

    const result = await controller.executeNext({
      user: { id: 'user-1' },
    } as any);

    expect(result).toEqual({
      status: 'unsupported',
      reason: 'no_actionable_next_action',
    });
    expect(coordinator.execute).not.toHaveBeenCalled();
  });

  it('binds confirmation execution to the authenticated user', async () => {
    coordinator.confirmAndExecute.mockResolvedValue({ status: 'completed' });

    const result = await controller.confirm({
      user: { id: 'user-1' },
      body: { token: 'token-1' },
    } as any);

    expect(result).toEqual({ status: 'completed' });
    expect(coordinator.confirmAndExecute).toHaveBeenCalledWith(
      'user-1',
      'token-1',
    );
  });
});
