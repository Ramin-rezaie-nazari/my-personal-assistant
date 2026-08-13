import { DecisionExecutionCoordinatorService } from './decision-execution-coordinator.service';

describe('DecisionExecutionCoordinatorService', () => {
  const candidate = { id: 'd1', domain: 'workout', action: 'start', score: 1, confidence: 1 };
  const policy = { resolve: () => ({ timeoutMs: 100, maxAttempts: 2, retryDelayMs: 0, dryRun: false }), run: async (_c: any, _p: any, operation: any) => ({ result: await operation(), attempts: [{ attempt: 1 }] }) };
  const confirmation = { assess: () => ({ required: false, reason: '', token: undefined }), consume: jest.fn() };
  const history = { record: jest.fn() };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  const outcomeLearning = { record: jest.fn().mockResolvedValue(undefined) };

  const build = (gate: any, adapters: any, feedback: any, executionPolicy: any = policy) => new DecisionExecutionCoordinatorService(
    gate,
    adapters,
    feedback,
    executionPolicy as any,
    history as any,
    confirmation as any,
    audit as any,
    outcomeLearning as any,
  );

  it('runs the full happy path and records completion feedback', async () => {
    const feedback: any[] = [];
    const service = build(
      { open: () => ({ allowed: true, key: 'u1:d1:start', reason: 'execution_started' }), complete: jest.fn(), fail: jest.fn() },
      { execute: async () => ({ handled: true, status: 'executed', action: 'start', result: { ok: true } }) },
      { record: (item: any) => feedback.push(item) },
    );
    const receipt = await service.execute('u1', candidate);
    expect(receipt.status).toBe('completed');
    expect(receipt.result).toEqual({ ok: true });
    expect(receipt.attempts).toBe(1);
    expect(feedback[0].outcome).toBe('completed');
  });

  it('turns an unsupported adapter into a safe skipped outcome', async () => {
    const feedback: any[] = [];
    const service = build(
      { open: () => ({ allowed: true, key: 'u1:d1:start', reason: 'execution_started' }), complete: jest.fn(), fail: jest.fn() },
      { execute: async () => ({ handled: false, status: 'unsupported', action: 'start' }) },
      { record: (item: any) => feedback.push(item) },
    );
    const receipt = await service.execute('u1', candidate);
    expect(receipt.status).toBe('unsupported');
    expect(feedback[0].outcome).toBe('skipped');
  });

  it('converts adapter exceptions into failed execution and learning feedback', async () => {
    const feedback: any[] = [];
    const failingPolicy = { ...policy, run: async () => { throw new Error('provider unavailable'); } };
    const service = build(
      { open: () => ({ allowed: true, key: 'u1:d1:start', reason: 'execution_started' }), complete: jest.fn(), fail: jest.fn() },
      { execute: async () => { throw new Error('provider unavailable'); } },
      { record: (item: any) => feedback.push(item) },
      failingPolicy,
    );
    const receipt = await service.execute('u1', candidate);
    expect(receipt.status).toBe('failed');
    expect(receipt.reason).toBe('provider unavailable');
    expect(feedback[0].outcome).toBe('failed');
  });

  it('does not execute an action rejected by guardrails', async () => {
    const execute = jest.fn();
    const service = build(
      { open: () => ({ allowed: false, key: 'u1:d1:start', reason: 'already_executed' }) },
      { execute },
      { record: jest.fn() },
    );
    const receipt = await service.execute('u1', candidate);
    expect(receipt.status).toBe('blocked');
    expect(execute).not.toHaveBeenCalled();
  });

  it('supports dry-run without invoking an adapter', async () => {
    const execute = jest.fn();
    const dryRunPolicy = { resolve: () => ({ timeoutMs: 100, maxAttempts: 2, retryDelayMs: 0, dryRun: true }), run: jest.fn() };
    const service = build(
      { open: () => ({ allowed: true, key: 'u1:d1:start', reason: 'execution_started' }) },
      { execute },
      { record: jest.fn() },
      dryRunPolicy,
    );
    const receipt = await service.execute('u1', candidate);
    expect(receipt.status).toBe('dry_run');
    expect(execute).not.toHaveBeenCalled();
  });
});
