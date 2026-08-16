import { DecisionReplanPolicyService } from './decision-replan-policy.service';

describe('DecisionReplanPolicyService', () => {
  const service = new DecisionReplanPolicyService();
  const candidate = (score: number, priority = 0.5) => ({
    id: String(score),
    domain: 'schedule' as const,
    action: 'act',
    score,
    confidence: 1,
    priority,
  });

  it('replans when a hard context trigger occurs', () => {
    expect(
      service.shouldReplan(
        'constraint_changed',
        candidate(0.1),
        candidate(0.2),
      ),
    ).toBe(true);
  });

  it('requires a meaningful advantage for context changes', () => {
    expect(
      service.shouldReplan('context_changed', candidate(0.7), candidate(0.75)),
    ).toBe(false);
    expect(
      service.shouldReplan('context_changed', candidate(0.7), candidate(0.95)),
    ).toBe(true);
  });
});
