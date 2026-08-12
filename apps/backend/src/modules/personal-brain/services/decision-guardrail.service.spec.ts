import { DecisionGuardrailService } from './decision-guardrail.service';

describe('DecisionGuardrailService', () => {
  const candidate = { id: 'd1', domain: 'workout', action: 'start', score: 1, confidence: 1 };

  it('allows a new decision and remembers its result', () => {
    const service = new DecisionGuardrailService({ has: () => false, remember: jest.fn() } as any, { allow: () => true } as any);
    expect(service.check('u1', candidate).allowed).toBe(true);
    service.remember('u1', candidate, { ok: true });
    expect((service as any).idempotency.remember).toHaveBeenCalled();
  });

  it('blocks duplicate and rate-limited decisions', () => {
    const duplicate = new DecisionGuardrailService({ has: () => true } as any, { allow: () => true } as any);
    expect(duplicate.check('u1', candidate).reason).toBe('already_executed');
    const limited = new DecisionGuardrailService({ has: () => false } as any, { allow: () => false } as any);
    expect(limited.check('u1', candidate).reason).toBe('rate_limited');
  });
});
