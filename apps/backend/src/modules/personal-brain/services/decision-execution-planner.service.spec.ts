import { DecisionExecutionPlannerService } from './decision-execution-planner.service';

describe('DecisionExecutionPlannerService', () => {
  it('creates a deterministic execution order', () => {
    const service = new DecisionExecutionPlannerService();
    const steps = service.plan({
      selected: [
        { id: 'n', domain: 'notification', action: 'notify', score: 1, confidence: 1 },
        { id: 's', domain: 'schedule', action: 'schedule', score: 1, confidence: 1 },
        { id: 'w', domain: 'workout', action: 'train', score: 1, confidence: 1 },
      ], rejected: [], blocked: [], reason: 'test',
    });
    expect(steps.map((x) => x.candidateId)).toEqual(['s', 'w', 'n']);
    expect(steps[1].dependsOn).toEqual(['s']);
  });
});
