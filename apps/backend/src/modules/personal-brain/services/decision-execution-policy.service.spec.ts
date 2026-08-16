import { DecisionExecutionPolicyService } from './decision-execution-policy.service';

describe('DecisionExecutionPolicyService', () => {
  const candidate = {
    id: 'd1',
    domain: 'notification' as const,
    action: 'send',
    score: 1,
    confidence: 1,
  };

  it('resolves safe domain defaults and clamps overrides', () => {
    const service = new DecisionExecutionPolicyService();
    expect(service.resolve(candidate)).toEqual({
      timeoutMs: 5000,
      maxAttempts: 2,
      retryDelayMs: 250,
      dryRun: false,
    });
    expect(
      service.resolve(candidate, {
        executionPolicy: {
          timeoutMs: 999999,
          maxAttempts: 99,
          retryDelayMs: -5,
        },
      }),
    ).toEqual({
      timeoutMs: 60000,
      maxAttempts: 3,
      retryDelayMs: 0,
      dryRun: false,
    });
  });

  it('retries a transient failure and eventually succeeds', async () => {
    const service = new DecisionExecutionPolicyService();
    let calls = 0;
    const result = await service.run(
      candidate,
      { timeoutMs: 100, maxAttempts: 2, retryDelayMs: 0, dryRun: false },
      async () => {
        calls += 1;
        if (calls === 1) throw new Error('temporary');
        return 'ok';
      },
    );
    expect(result.result).toBe('ok');
    expect(result.attempts).toHaveLength(2);
  });

  it('supports dry-run without invoking the action', async () => {
    const service = new DecisionExecutionPolicyService();
    const action = jest.fn();
    const result = await service.run(
      candidate,
      { timeoutMs: 100, maxAttempts: 2, retryDelayMs: 0, dryRun: true },
      action,
    );
    expect(action).not.toHaveBeenCalled();
    expect(result.attempts[0].status).toBe('dry_run');
  });
});
