import { PreferenceConflictResolverService } from './preference-conflict-resolver.service';

describe('PreferenceConflictResolverService', () => {
  const service = new PreferenceConflictResolverService();

  it('prefers the strongest weighted preference', () => {
    const result = service.resolve([
      { key: 'time', value: 'morning', score: 0.8, confidence: 0.9, priority: 1 },
      { key: 'time', value: 'evening', score: 0.9, confidence: 0.7, priority: 2 },
    ]);
    expect(result.selected?.value).toBe('evening');
  });

  it('lets hard constraints override soft preferences', () => {
    const result = service.resolve([
      { key: 'time', value: 'morning', score: 1, confidence: 1, priority: 10 },
      { key: 'time', value: 'evening', score: 0.1, confidence: 0.1, priority: 0, hardConstraint: true },
    ]);
    expect(result.selected?.value).toBe('evening');
  });
});
