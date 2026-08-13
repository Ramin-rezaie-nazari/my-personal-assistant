import { GoalHierarchyService } from './goal-hierarchy.service';
import { LongTermDecisionImpactService } from './long-term-decision-impact.service';

describe('LongTermDecisionImpactService', () => {
  it('rewards alignment and penalizes downside', () => {
    const service = new LongTermDecisionImpactService(new GoalHierarchyService());
    const goals = [
      { id: 'g1', title: 'Fitness', category: 'health', priority: 8, progressPercent: 30, targetDate: '2026-10-01', daysRemaining: 49 },
    ];

    const aligned = service.evaluate(goals, { id: 'a', action: 'workout', domain: 'workout', goalAlignment: 1, goalDownside: 0 });
    const harmful = service.evaluate(goals, { id: 'b', action: 'skip-workout', domain: 'workout', goalAlignment: 0.1, goalDownside: 1 });

    expect(aligned.score).toBeGreaterThan(harmful.score);
    expect(harmful.rationale).toContain('creates long-term trade-off against: Fitness');
  });
});
