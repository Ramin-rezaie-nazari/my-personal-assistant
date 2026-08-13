import { MultiScenarioSimulatorService } from './multi-scenario-simulator.service';

describe('MultiScenarioSimulatorService', () => {
  it('returns ranked plans and keeps the result bounded', () => {
    const planner = { compare: jest.fn().mockReturnValue({ scenarios: [
      { id: 'scenario:a', title: 'workout', action: 'workout', state: { goalAlignment: 0.9, goalDownside: 0.1, budgetImpact: 0, capacityImpact: 0.1, healthImpact: 0.1, confidence: 0.9 }, score: 0.8, recommendation: 'best', rationale: ['strong alignment'] },
      { id: 'scenario:b', title: 'rest', action: 'rest', state: { goalAlignment: 0.3, goalDownside: 0.2, budgetImpact: 0, capacityImpact: 0, healthImpact: 0, confidence: 0.9 }, score: 0.45, recommendation: 'weak', rationale: ['balanced trade-off'] },
    ], best: { id: 'scenario:a', title: 'workout', action: 'workout', state: { goalAlignment: 0.9, goalDownside: 0.1, budgetImpact: 0, capacityImpact: 0.1, healthImpact: 0.1, confidence: 0.9 }, score: 0.8, recommendation: 'best', rationale: ['strong alignment'] } }) };
    const service = new MultiScenarioSimulatorService(planner as any);
    const result = service.simulate([
      { id: 'a', domain: 'workout', action: 'workout', score: 0.8, confidence: 0.9, priority: 0.8, goalAlignment: 0.9 },
      { id: 'b', domain: 'schedule', action: 'rest', score: 0.4, confidence: 0.9, priority: 0.5, goalAlignment: 0.3 },
    ], { maxPlans: 3 });
    expect(result.plans.length).toBeLessThanOrEqual(3);
    expect(result.best?.id).toBe('plan-a');
  });
});
