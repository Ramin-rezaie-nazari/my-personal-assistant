import { AdaptiveReplanningService } from './adaptive-replanning.service';

describe('AdaptiveReplanningService', () => {
  const dynamicReplanning = {
    replanRemainingDay: jest.fn(),
  };

  const service = new AdaptiveReplanningService(dynamicReplanning as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests replanning after a failed execution', async () => {
    dynamicReplanning.replanRemainingDay.mockResolvedValue({
      requiresAttention: false,
      overdue: [],
      conflicts: 0,
      unscheduled: [],
      nextAction: null,
    });

    const result = await service.evaluate('user-1', {
      planId: 'plan-failed',
      status: 'failed',
      steps: [],
      completed: ['a'],
      blocked: [],
      failed: ['b'],
      nextStep: 'c',
      reason: 'plan_stopped_after_step_failure',
    });

    expect(result.shouldReplan).toBe(true);
    expect(result.reason).toBe('execution-failure-changed-plan');
  });

  it('does not replan when execution and schedule are stable', async () => {
    dynamicReplanning.replanRemainingDay.mockResolvedValue({
      requiresAttention: false,
      overdue: [],
      conflicts: 0,
      unscheduled: [],
      nextAction: { id: 'next' },
    });

    const result = await service.evaluate('user-1', {
      planId: 'plan-completed',
      status: 'completed',
      steps: [],
      completed: ['a', 'b'],
      blocked: [],
      failed: [],
      nextStep: null,
      reason: 'plan_completed',
    });

    expect(result.shouldReplan).toBe(false);
    expect(result.reason).toBe('current-plan-still-valid');
    expect(result.nextAction).toEqual({ id: 'next' });
  });
});
