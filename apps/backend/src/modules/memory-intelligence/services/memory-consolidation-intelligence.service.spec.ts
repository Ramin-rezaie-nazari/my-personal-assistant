import { MemoryConsolidationIntelligenceService } from './memory-consolidation-intelligence.service';
import { MemoryGoverned } from '../models/memory-governance.model';

describe('MemoryConsolidationIntelligenceService', () => {
  const service = new MemoryConsolidationIntelligenceService();
  const make = (
    id: string,
    confidence: number,
    importance: number,
  ): MemoryGoverned => ({
    memoryId: id,
    userId: 'u1',
    layer: 'derived',
    source: 'behavior',
    visibility: 'internal',
    confidence,
    importance,
    retention: '3_months',
    createdAt: new Date(),
    relatedMemoryIds: [],
    topicKeys: ['workout'],
  });

  it('keeps the highest-value memory as representative and absorbs duplicates', () => {
    const result = service.consolidate([
      make('a', 0.8, 0.9),
      make('b', 0.95, 0.7),
      make('c', 0.7, 0.6),
    ]);
    expect(result?.representative.memoryId).toBe('a');
    expect(result?.absorbedMemoryIds).toEqual(['b', 'c']);
    expect(result?.representative.relatedMemoryIds).toContain('b');
  });

  it('surfaces only sufficiently confident and important user-visible memories', () => {
    expect(
      service.shouldSurface({
        ...make('a', 0.8, 0.7),
        visibility: 'user_visible',
      }),
    ).toBe(true);
    expect(
      service.shouldSurface({
        ...make('b', 0.7, 0.9),
        visibility: 'user_visible',
      }),
    ).toBe(false);
    expect(
      service.shouldSurface({ ...make('c', 0.9, 0.7), visibility: 'internal' }),
    ).toBe(false);
  });
});
