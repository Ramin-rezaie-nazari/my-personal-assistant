import { PlanExecutionService } from './plan-execution.service';

const candidate = (id: string, action = id) => ({
  id,
  domain: 'conversation' as const,
  action,
  score: 0.8,
  confidence: 0.9,
  priority: 0.8,
});

describe('PlanExecutionService', () => {
  const planner = { plan: jest.fn() };
  const coordinator = { execute: jest.fn() };
  const state = { start: jest.fn(), complete: jest.fn(), cancel: jest.fn(), fail: jest.fn() };
  const persistentState = {
    resume: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => jest.clearAllMocks());

  it('executes ordered steps to completion', async () => {
    planner.plan.mockReturnValue([
      { order: 1, candidateId: 'a', domain: 'conversation', action: 'a', dependsOn: [] },
      { order: 2, candidateId: 'b', domain: 'conversation', action: 'b', dependsOn: ['a'] },
    ]);
    coordinator.execute.mockResolvedValue({ status: 'completed', reason: 'action_executed' });
    const service = new PlanExecutionService(planner as never, coordinator as never, state as never, persistentState as never);
    const result = await service.execute('u1', { selected: [candidate('a'), candidate('b')], rejected: [], blocked: [], reason: 'test' });
    expect(result.status).toBe('completed');
    expect(result.completed).toEqual(['a', 'b']);
    expect(coordinator.execute).toHaveBeenCalledTimes(2);
  });

  it('stops after a failed step', async () => {
    planner.plan.mockReturnValue([
      { order: 1, candidateId: 'a', domain: 'conversation', action: 'a', dependsOn: [] },
      { order: 2, candidateId: 'b', domain: 'conversation', action: 'b', dependsOn: ['a'] },
    ]);
    coordinator.execute.mockResolvedValueOnce({ status: 'failed', reason: 'boom' });
    const service = new PlanExecutionService(planner as never, coordinator as never, state as never, persistentState as never);
    const result = await service.execute('u1', { selected: [candidate('a'), candidate('b')], rejected: [], blocked: [], reason: 'test' });
    expect(result.status).toBe('failed');
    expect(result.failed).toEqual(['a']);
    expect(coordinator.execute).toHaveBeenCalledTimes(1);
  });

  it('blocks a confirmation-gated step without executing later steps', async () => {
    planner.plan.mockReturnValue([
      { order: 1, candidateId: 'a', domain: 'conversation', action: 'a', dependsOn: [] },
      { order: 2, candidateId: 'b', domain: 'conversation', action: 'b', dependsOn: ['a'] },
    ]);
    coordinator.execute.mockResolvedValueOnce({ status: 'pending_confirmation', reason: 'confirmation_required' });
    const service = new PlanExecutionService(planner as never, coordinator as never, state as never, persistentState as never);
    const result = await service.execute('u1', { selected: [candidate('a'), candidate('b')], rejected: [], blocked: [], reason: 'test' });
    expect(result.status).toBe('blocked');
    expect(result.blocked).toEqual(['a']);
    expect(coordinator.execute).toHaveBeenCalledTimes(1);
    expect(state.cancel).toHaveBeenCalledWith('a');
  });
});
