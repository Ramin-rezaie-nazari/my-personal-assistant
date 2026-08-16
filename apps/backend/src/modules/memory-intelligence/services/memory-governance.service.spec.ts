import { MemoryGovernanceService } from './memory-governance.service';
import { MemoryGoverned } from '../models/memory-governance.model';

describe('MemoryGovernanceService', () => {
  const service = new MemoryGovernanceService();
  const base: MemoryGoverned = {
    memoryId: 'm1',
    userId: 'u1',
    layer: 'derived',
    source: 'behavior',
    visibility: 'internal',
    confidence: 0.7,
    importance: 0.8,
    retention: '3_months',
    createdAt: new Date('2026-08-12T00:00:00Z'),
    relatedMemoryIds: [],
    topicKeys: ['fitness'],
  };

  it('applies a deterministic expiration date for finite retention', () => {
    const result = service.applyRetention(base);
    expect(result.expiresAt?.toISOString()).toBe('2026-11-10T00:00:00.000Z');
  });

  it('keeps unlimited memories without an expiration date', () => {
    expect(
      service.applyRetention({ ...base, retention: 'unlimited' }).expiresAt,
    ).toBeUndefined();
  });

  it('reinforces explicit memories and uncertain or important ones', () => {
    expect(service.shouldReinforce({ ...base, source: 'explicit_user' })).toBe(
      true,
    );
    expect(service.shouldReinforce({ ...base, confidence: 0.5 })).toBe(true);
    expect(service.shouldReinforce({ ...base, importance: 0.9 })).toBe(true);
  });
});
