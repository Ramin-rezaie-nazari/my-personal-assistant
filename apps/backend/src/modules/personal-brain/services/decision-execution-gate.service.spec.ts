import { DecisionExecutionGateService } from './decision-execution-gate.service';

describe('DecisionExecutionGateService', () => {
  const candidate = { id: 'd1', domain: 'workout', action: 'start', score: 1, confidence: 1 };

  it('starts and completes a guarded execution', () => {
    const remembered: unknown[] = [];
    const service = new DecisionExecutionGateService(
      { check: () => ({ allowed: true, key: 'u1:d1:start', reason: 'allowed' }), remember: (_u: string, _c: unknown, r: unknown) => remembered.push(r) } as any,
      { start: () => ({ state: 'running' }), complete: () => ({ state: 'completed' }) } as any,
    );
    expect(service.open('u1', candidate).state).toBe('running');
    expect(service.complete('u1', candidate, { ok: true }).state).toBe('completed');
    expect(remembered).toEqual([{ ok: true }]);
  });

  it('does not start when guardrails reject', () => {
    const service = new DecisionExecutionGateService(
      { check: () => ({ allowed: false, key: 'k', reason: 'rate_limited' }) } as any,
      { start: jest.fn() } as any,
    );
    expect(service.open('u1', candidate).reason).toBe('rate_limited');
  });
});
