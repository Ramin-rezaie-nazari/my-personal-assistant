import { DecisionLearningPolicyService } from './decision-learning-policy.service';

describe('DecisionLearningPolicyService', () => {
  const service = new DecisionLearningPolicyService();

  it('uses stable history conservatively', () => {
    const result = service.apply(0.8, {
      stable: true,
      confidenceBoost: 0.03,
      repeatedReasons: [{ reason: 'goal alignment', count: 5 }],
      selectedFrequency: [{ id: 'gym', count: 4 }],
    });

    expect(result.confidence).toBeCloseTo(0.83);
    expect(result.historicalReasons[0]).toContain('repeated 5 times');
  });

  it('ignores weak or unstable history', () => {
    const result = service.apply(0.8, {
      stable: false,
      confidenceBoost: 0.04,
      repeatedReasons: [{ reason: 'old pattern', count: 9 }],
      selectedFrequency: [{ id: 'gym', count: 9 }],
    });

    expect(result.confidence).toBe(0.8);
    expect(result.historicalReasons).toHaveLength(0);
  });
});
