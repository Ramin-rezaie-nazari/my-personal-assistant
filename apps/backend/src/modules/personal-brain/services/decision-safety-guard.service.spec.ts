import { DecisionSafetyGuardService } from './decision-safety-guard.service';

describe('DecisionSafetyGuardService', () => {
  const service = new DecisionSafetyGuardService();

  it('caps actions per domain and total actions', () => {
    const result = service.sanitize({
      selected: [
        { id: '1', domain: 'workout', action: 'train', score: 1, confidence: 1 },
        { id: '2', domain: 'workout', action: 'train-again', score: 0.9, confidence: 1 },
        { id: '3', domain: 'nutrition', action: 'eat', score: 0.8, confidence: 1 },
      ], rejected: [], blocked: [], reason: 'test',
    }, { maxActions: 2, maxPerDomain: 1 });
    expect(result.selected.map((x) => x.id)).toEqual(['1', '3']);
    expect(result.rejected.map((x) => x.id)).toContain('2');
  });

  it('blocks configured domains', () => {
    const result = service.sanitize({
      selected: [{ id: '1', domain: 'notification', action: 'notify', score: 1, confidence: 1 }],
      rejected: [], blocked: [], reason: 'test',
    }, { blockedDomains: ['notification'] });
    expect(result.selected).toHaveLength(0);
    expect(result.rejected).toHaveLength(1);
  });
});
