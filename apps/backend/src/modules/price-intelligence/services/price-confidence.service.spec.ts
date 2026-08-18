import { PriceConfidenceService } from './price-confidence.service';

describe('PriceConfidenceService', () => {
  const service = new PriceConfidenceService();
  const now = new Date('2026-08-18T08:00:00Z');

  it('marks multiple fresh successful sources high confidence', () => {
    expect(
      service.score({
        successfulSources: 3,
        attemptedSources: 4,
        observedAt: new Date('2026-08-18T07:30:00Z'),
        now,
      }),
    ).toMatchObject({ confidence: 'high', reason: 'multiple_fresh_sources' });
  });

  it('marks stale observations stale even when multiple sources exist', () => {
    expect(
      service.score({
        successfulSources: 4,
        attemptedSources: 4,
        observedAt: new Date('2026-08-15T07:00:00Z'),
        now,
      }),
    ).toMatchObject({ confidence: 'stale', reason: 'older_than_48_hours' });
  });

  it('does not invent confidence without sources', () => {
    expect(service.score({ successfulSources: 0, attemptedSources: 3, now })).toMatchObject({
      confidence: 'unverified',
      reason: 'no_verified_sources',
    });
  });
});
