import { DecisionExecutionCoordinatorService } from './decision-execution-coordinator.service';

describe('DecisionExecutionCoordinatorService', () => {
  const candidate = {
    id: 'd1',
    domain: 'workout',
    action: 'start',
    score: 1,
    confidence: 1,
  } as any;
  const policy = {
    resolve: () => ({
      timeoutMs: 100,
      maxAttempts: 2,
      retryDelayMs: 0,
      dryRun: false,
    }),
    run: async (_c: any, _p: any, operation: any) => ({
      result: await operation(),
      attempts: [{ attempt: 1 }],
    }),
  };

  const build = (overrides: Record<string, unknown> = {}) => {
    const feedback = { record: jest.fn() };
    const history = { record: jest.fn() };
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    const outcomeLearning = { record: jest.fn().mockResolvedValue(undefined) };
    const gate = {
      open: jest.fn(() => ({
        allowed: true,
        key: 'u1:d1:start',
        reason: 'execution_started',
      })),
      complete: jest.fn(),
      fail: jest.fn(),
    };
    const adapters = {
      execute: jest.fn(async () => ({
        handled: true,
        status: 'executed',
        action: 'start',
        result: { ok: true },
      })),
    };
    const confirmation = {
      assess: jest.fn(() => ({ required: false })),
      consume: jest.fn(),
    };
    const service = new DecisionExecutionCoordinatorService(
      gate as any,
      adapters as any,
      feedback as any,
      (overrides.policy ?? policy) as any,
      history as any,
      confirmation as any,
      audit as any,
      outcomeLearning as any,
    );
    return {
      service,
      feedback,
      history,
      audit,
      outcomeLearning,
      gate,
      adapters,
      confirmation,
    };
  };

  it('runs the full happy path and records completion feedback', async () => {
    const { service, feedback, history, outcomeLearning } = build();
    const receipt = await service.execute('u1', candidate);
    expect(receipt.status).toBe('completed');
    expect(receipt.result).toEqual({ ok: true });
    expect(receipt.attempts).toBe(1);
    expect(feedback.record).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'completed' }),
    );
    expect(history.record).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'completed' }),
    );
    expect(outcomeLearning.record).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'system' }),
    );
  });

  it('turns an unsupported adapter into a safe skipped outcome', async () => {
    const { service, feedback, gate, adapters } = build();
    adapters.execute.mockResolvedValue({
      handled: false,
      status: 'unsupported',
      action: 'start',
      result: { ok: false },
    });
    const receipt = await service.execute('u1', candidate);
    expect(receipt.status).toBe('unsupported');
    expect(feedback.record).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'skipped' }),
    );
    expect(gate.fail).toHaveBeenCalledWith(
      'u1',
      candidate,
      'unsupported_action',
    );
  });

  it('converts adapter exceptions into failed execution and learning feedback', async () => {
    const { service, feedback, gate, adapters } = build();
    adapters.execute.mockRejectedValue(new Error('provider unavailable'));
    const receipt = await service.execute('u1', candidate);
    expect(receipt.status).toBe('failed');
    expect(receipt.reason).toBe('provider unavailable');
    expect(feedback.record).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'failed' }),
    );
    expect(gate.fail).toHaveBeenCalledWith(
      'u1',
      candidate,
      'provider unavailable',
    );
  });

  it('does not execute an action rejected by guardrails', async () => {
    const { service, adapters, gate } = build();
    gate.open.mockReturnValue({
      allowed: false,
      key: 'u1:d1:start',
      reason: 'already_executed',
    });
    const receipt = await service.execute('u1', candidate);
    expect(receipt.status).toBe('blocked');
    expect(adapters.execute).not.toHaveBeenCalled();
  });

  it('supports dry-run without invoking an adapter', async () => {
    const execute = jest.fn();
    const dryRunPolicy = {
      resolve: () => ({
        timeoutMs: 100,
        maxAttempts: 2,
        retryDelayMs: 0,
        dryRun: true,
      }),
      run: execute,
    };
    const { service, adapters } = build({ policy: dryRunPolicy });
    const receipt = await service.execute('u1', candidate);
    expect(receipt.status).toBe('dry_run');
    expect(execute).toHaveBeenCalled();
    expect(adapters.execute).not.toHaveBeenCalled();
  });

  it('requires confirmation before executing a sensitive action', async () => {
    const { service, confirmation, adapters } = build();
    confirmation.assess.mockReturnValue({
      required: true,
      token: 'confirm-1',
    } as any);
    const receipt = await service.execute('u1', candidate);
    expect(receipt.status).toBe('pending_confirmation');
    expect(receipt.confirmationToken).toBe('confirm-1');
    expect(adapters.execute).not.toHaveBeenCalled();
  });
});
