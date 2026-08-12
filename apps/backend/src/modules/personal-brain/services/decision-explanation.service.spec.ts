import { DecisionExplanationService } from './decision-explanation.service';

describe('DecisionExplanationService', () => {
  it('creates a compact explainable decision summary', () => {
    const service = new DecisionExplanationService();
    const result = service.explain({
      selected: [{ id: '1', domain: 'workout', action: 'train', score: 0.9, confidence: 0.8 }],
      rejected: [{ id: '2', domain: 'notification', action: 'push', score: 0.2, confidence: 0.4 }],
      blocked: [], reason: 'ranked_by_priority',
    });
    expect(result.selected[0].action).toBe('train');
    expect(result.rejected[0].id).toBe('2');
  });
});
