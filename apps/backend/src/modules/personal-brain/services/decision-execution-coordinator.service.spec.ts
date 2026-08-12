import { DecisionExecutionCoordinatorService } from './decision-execution-coordinator.service';

describe('DecisionExecutionCoordinatorService', () => {
  const candidate = { id: 'd1', domain: 'workout', action: 'start', score: 1, confidence: 1 };
  const policy = { resolve: () => ({ timeoutMs: 100, maxAttempts: 2, retryDelayMs: 0, dryRun: false }), run: async (_c: any, _p: any, operation: any) => ({ result: await operation(), attempts: [{ attempt: 1 }] }) };

  it('runs the full happy path and records completion feedback', async () => {
    const feedback: any[] = [];
    const service = new DecisionExecutionCoordinatorService(
      { open: () => ({ allowed: true, key: 'u1:d1:start', reason: 'execution_started' }), complete: jest.fn(), fail: jest.fn() } as any,
      { execute: async () => ({ handled: true, status: 'executed', action: 'start', result: { ok: true } }) } as any,
      { record: (item: any) => feedback.push(item) } as any,
      policy as any,
    );
    const receipt = await service.execute('u1', candidate);
    expect(receipt.status).toBe('completed');
    expect(receipt.result).toEqual({ ok: true });
    expect(receipt.attempts).toBe(1);
    expect(feedback[0].outcome).toBe('completed');
  });

  it('turns an unsupported adapter into a safe skipped outcome', async () => {
    const feedback: any[] = [];
    const service = new DecisionExecutionCoordinatorService(
      { open: () => ({ allowed: true, key: 'u1:d1:start', reason: 'execution_started' }), complete: jest.fn(), fail: jest.fn() } as any,
      { execute: async () => ({ handled: false, status: 'unsupported', action: 'start' }) } as any,
      { record: (item: any) => feedback.push(item) } as any,
      policy as any,
    );
    const receipt = await service.execute('u1', candidate);
    expect(receipt.status).toBe('unsupported');
    expect(feedback[0].outcome).toBe('skipped');
  });

  it('converts adapter exceptions into failed execution and learning feedback', async () => {
    const feedback: any[] = [];
    const failingPolicy = { ...policy, run: async () => { throw new Error('provider unavailable'); } };
    const service = new DecisionExecutionCoordinatorService(
      { open: () => ({ allowed: true, key: 'u1:d1:start', reason: 'execution_started' }), complete: jest.fn(), fail: jest.fn() } as any,
      { execute: async () => { throw new Error('provider unavailable'); } } as any,
      { record: (item: any) => feedback.push(item) } as any,
      failingPolicy as any,
    );
    const receipt = await service.execute('u1', candidate);
    expect(receipt.status).toBe('failed');
    expect(receipt.reason).toBe('provider unavailable');
    expect(feedback[0].outcome).toBe('failed');
  });

  it('does not execute an action rejected by guardrails', async () => {
    const execute = jest.fn();
    const service = new DecisionExecutionCoordinatorService(
      { open: () => ({ allowed: false, key: 'u1:d1:start', reason: 'already_executed' }) } as any,
      { execute } as any,
      { record: jest.fn() } as any,
      policy as any,
    );
    const receipt = await service.execute('u1', candidate);
    expect(receipt.status).toBe('blocked');
    expect(execute).not.toHaveBeenCalled();
  });

  it('supports dry-run without invoking an adapter', async () => {
    const execute = jest.fn();
    const dryRunPolicy = { resolve: () => ({ timeoutMs: 100, maxAttempts: 2, retryDelayMs: 0, dryRun: true }), run: jest.fn() };
    const service = new DecisionExecutionCoordinatorService(
      { open: () => ({ allowed: true, key: 'u1:d1:start', reason: 'execution_started' }) } as any,
      { execute } as any,
      { record: jest.fn() } as any,
      dryRunPolicy as any,
    );
    const receipt = await service.execute('u1', candidate);
    expect(receipt.status).toBe('dry_run');
    expect(execute).not.toHaveBeenCalled();
  });
});
