import { ScenarioPlanningService } from './scenario-planning.service';
import { DecisionCandidate } from './unified-decision-engine.service';

describe('ScenarioPlanningService', () => {
  const service = new ScenarioPlanningService();

  it('prefers the scenario with stronger long-term alignment and lower downside', () => {
    const candidates: DecisionCandidate[] = [
      {
        id: 'a',
        domain: 'workout',
        action: 'do_workout',
        score: 0.8,
        confidence: 0.9,
        priority: 0.8,
        goalAlignment: 0.95,
        goalDownside: 0.05,
      },
      {
        id: 'b',
        domain: 'conversation',
        action: 'skip_workout',
        score: 0.9,
        confidence: 0.9,
        priority: 0.8,
        goalAlignment: 0.1,
        goalDownside: 0.9,
      },
    ];
    const result = service.compare({ candidates });
    expect(result.best?.id).toBe('scenario:a');
    expect(result.scenarios[0].score).toBeGreaterThan(
      result.scenarios[1].score,
    );
  });

  it('marks a scenario unsafe when health impact is severe', () => {
    const candidates: DecisionCandidate[] = [
      {
        id: 'a',
        domain: 'workout',
        action: 'hard_workout',
        score: 0.9,
        confidence: 0.9,
        priority: 0.9,
        goalAlignment: 1,
        goalDownside: 0,
      },
    ];
    const result = service.compare({
      candidates,
      context: { healthConstraint: true },
    });
    expect(result.best?.recommendation).toBe('unsafe');
  });
});
