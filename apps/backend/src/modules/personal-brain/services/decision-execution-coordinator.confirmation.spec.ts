import { DecisionExecutionCoordinatorService } from './decision-execution-coordinator.service';
import { ActionConfirmationIntelligenceService } from './action-confirmation-intelligence.service';

describe('DecisionExecutionCoordinator confirmation flow', () => {
  it('does not execute a risky action until confirmed', async () => {
    const confirmation = new ActionConfirmationIntelligenceService();
    const adapters = { execute: jest.fn().mockResolvedValue({ handled: true, result: { ok: true } }) } as any;
    const gate = { open: jest.fn().mockReturnValue({ allowed: true }), complete: jest.fn(), fail: jest.fn() } as any;
    const policy = { resolve: jest.fn().mockReturnValue({ timeoutMs: 1000, maxAttempts: 1, retryDelayMs: 0, dryRun: false }), run: jest.fn().mockImplementation((_c: any, _p: any, fn: any) => Promise.resolve(fn()).then((result: any) => ({ result, attempts: [{}] }))) } as any;
    const feedback = { record: jest.fn() } as any;
    const history = { record: jest.fn() } as any;
    const audit = { record: jest.fn().mockResolvedValue(undefined) } as any;
    const outcomeLearning = { record: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new DecisionExecutionCoordinatorService(gate, adapters, feedback, policy, history, confirmation, audit, outcomeLearning);
    const candidate = { id: 'd1', domain: 'reminder', action: 'delete_reminder', score: 1, confidence: 1, source: 'test' } as any;

    const pending = await service.execute('u1', candidate, { value: 'x' });
    expect(pending.status).toBe('pending_confirmation');
    expect(adapters.execute).not.toHaveBeenCalled();

    const done = await service.confirmAndExecute('u1', pending.confirmationToken!);
    expect(done.status).toBe('completed');
    expect(adapters.execute).toHaveBeenCalledWith(candidate, expect.objectContaining({ value: 'x', confirmed: true }));
  });
});
