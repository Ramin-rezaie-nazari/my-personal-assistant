import { DecisionExplanationService } from './decision-explanation.service';

describe('DecisionExplanationService', () => {
  const service = new DecisionExplanationService();

  it('explains why a candidate was selected and why alternatives lost', () => {
    const result = service.explain({
      selected: [
        {
          id: 'yoga',
          domain: 'workout',
          action: 'do_yoga',
          score: 0.9,
          confidence: 0.92,
          goalAlignment: 0.95,
        },
      ],
      rejected: [
        {
          id: 'gym',
          domain: 'workout',
          action: 'do_gym',
          score: 0.7,
          confidence: 0.8,
          goalAlignment: 0.4,
        },
      ],
      blocked: [],
      reason: 'ranked_by_priority_confidence_and_score',
      rationale: ['Yoga strongly matched the active goal.'],
    });
    expect(result.summary).toContain('Do Yoga');
    expect(result.reasons.join(' ')).toContain('strongly matched');
    expect(result.rejectedReasons.join(' ')).toContain(
      'matched the current goal less closely',
    );
  });

  it('explains real user context without exposing raw implementation details', () => {
    const result = service.explainBrain(
      {
        state: {
          lifeContext: {
            fitness: {
              primaryGoal: {
                active: true,
                title: 'Stronger lower body',
                targetAreas: ['legs'],
                avoidBulk: false,
              },
              targetAreas: ['legs'],
              equipment: ['dumbbells'],
              performance: {
                formTrend: 0.12,
                completionTrend: 0.08,
                recoveryTrend: 0.05,
              },
            },
          },
        },
      } as any,
      {
        canDecide: true,
        confidence: 0.91,
        blockers: [],
        intent: 'fitness-recommendation',
        recommendation: 'Gym',
        nextAction: 'Start today workout',
        message: 'fitness-aware brain decision ready',
      },
    );
    expect(result.summary).toContain('Gym');
    expect(result.details).toContain('Stronger lower body');
    expect(result.details).toContain('improving');
    expect(result.confidence).toBe(0.91);
  });

  it('explains proactive coach actions with evidence', () => {
    const result = service.fromCoachAction(
      'Focus on your workout',
      'Your remaining capacity is limited, so I kept the next action small.',
      'high',
      [
        'Only about 25 minutes remain.',
        'Your schedule is already close to capacity.',
      ],
    );
    expect(result.summary).toContain('Focus on your workout');
    expect(result.details).toContain('25 minutes');
    expect(
      result.reasons.some((reason) => reason.includes('higher priority')),
    ).toBe(true);
  });
});
