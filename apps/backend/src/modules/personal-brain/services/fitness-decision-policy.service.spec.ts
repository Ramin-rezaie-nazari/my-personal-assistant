import { FitnessDecisionPolicyService } from './fitness-decision-policy.service';

describe('FitnessDecisionPolicyService', () => {
  const service = new FitnessDecisionPolicyService();
  const base = (fitness: any, input = 'give me a workout') => ({
    input,
    reasoning: { uncertainties: [], confidence: 0.9 },
    state: { lifeContext: { fitness } },
    userContext: { goals: [] },
  } as any);

  it('prefers calisthenics when no equipment is available', () => {
    const result: any = service.evaluate(base({ disciplines: [], primaryGoal: { kind: 'body_sculpt', targetAreas: ['thighs'], avoidBulk: true }, equipment: ['none'], constraints: [] }));
    expect(result?.intent).toBe('fitness-recommendation');
    expect(result?.candidates[0].id).toBe('calisthenics');
  });

  it('prefers gym when strength goal and equipment are available', () => {
    const result: any = service.evaluate(base({ disciplines: [], primaryGoal: { kind: 'strength', targetAreas: ['shoulders'], avoidBulk: false }, equipment: ['dumbbells', 'barbell'], constraints: [] }));
    expect(result?.candidates[0].id).toBe('gym');
  });

  it('recognizes low-impact recovery preference', () => {
    const result: any = service.evaluate(base({ disciplines: [], primaryGoal: { kind: 'general_fitness', targetAreas: ['full_body'], avoidBulk: false }, equipment: ['none'], constraints: [{ key: 'low_impact', enabled: true }] }, 'give me yoga today'));
    expect(result?.candidates[0].id).toBe('yoga');
  });
});
