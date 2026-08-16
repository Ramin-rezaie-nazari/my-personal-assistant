import { FitnessDecisionPolicyService } from './fitness-decision-policy.service';

describe('FitnessDecisionPolicyService', () => {
  const service = new FitnessDecisionPolicyService();
  const base = (fitness: any, input = 'give me a workout') =>
    ({
      input,
      reasoning: { uncertainties: [], confidence: 0.9 },
      state: { lifeContext: { fitness } },
      userContext: { goals: [] },
    }) as any;

  it('prefers calisthenics when no equipment is available', () => {
    const result: any = service.evaluate(
      base({
        disciplines: [],
        primaryGoal: {
          kind: 'body_sculpt',
          targetAreas: ['thighs'],
          avoidBulk: true,
        },
        equipment: ['none'],
        constraints: [],
      }),
    );
    expect(result?.intent).toBe('fitness-recommendation');
    expect(result?.candidates[0].id).toBe('calisthenics');
  });

  it('prefers gym when strength goal and equipment are available', () => {
    const result: any = service.evaluate(
      base({
        disciplines: [],
        primaryGoal: {
          kind: 'strength',
          targetAreas: ['shoulders'],
          avoidBulk: false,
        },
        equipment: ['dumbbells', 'barbell'],
        constraints: [],
      }),
    );
    expect(result?.candidates[0].id).toBe('gym');
  });

  it('recognizes low-impact recovery preference', () => {
    const result: any = service.evaluate(
      base(
        {
          disciplines: [],
          primaryGoal: {
            kind: 'general_fitness',
            targetAreas: ['full_body'],
            avoidBulk: false,
          },
          equipment: ['none'],
          constraints: [{ key: 'low_impact', enabled: true }],
        },
        'give me yoga today',
      ),
    );
    expect(result?.candidates[0].id).toBe('yoga');
  });

  it('uses stable long-term decision history as a bounded tie-breaker', () => {
    const result: any = service.evaluate(
      base({
        disciplines: [],
        primaryGoal: {
          kind: 'body_sculpt',
          targetAreas: ['legs'],
          avoidBulk: true,
        },
        equipment: ['none'],
        constraints: [],
        decisionMemory: {
          decisions: 12,
          changeSignal: 'stable',
          repeatedReasons: [],
          selectedFrequency: [{ id: 'yoga', count: 4 }],
        },
      }),
    );
    expect(result?.recommendation).toContain('decision-history:stable');
    expect(result?.recommendation).toContain('prior-choice-pattern:4');
  });

  it('does not use history when evidence is insufficient', () => {
    const result: any = service.evaluate(
      base({
        disciplines: [],
        primaryGoal: null,
        equipment: ['none'],
        constraints: [],
        decisionMemory: {
          decisions: 3,
          changeSignal: 'stable',
          repeatedReasons: [],
          selectedFrequency: [{ id: 'yoga', count: 2 }],
        },
      }),
    );
    expect(result?.recommendation).not.toContain('decision-history:stable');
  });
});
