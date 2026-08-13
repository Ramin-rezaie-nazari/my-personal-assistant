import { DecisionExplanationMemoryService } from './decision-explanation-memory.service';

describe('DecisionExplanationMemoryService', () => {
  const service = new DecisionExplanationMemoryService({} as any);

  it('detects changing decision reasons over time', () => {
    const detect = (service as any).detectChange.bind(service);
    expect(detect(['a', 'a', 'b', 'b', 'c', 'c'])).toBe('changing');
    expect(detect(['a', 'a', 'a', 'a'])).toBe('stable');
    expect(detect(['a', 'b', 'c'])).toBe('insufficient-data');
  });
});
