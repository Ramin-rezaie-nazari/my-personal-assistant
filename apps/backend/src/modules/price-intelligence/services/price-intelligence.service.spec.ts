import { PriceIntelligenceService } from './price-intelligence.service';

describe('PriceIntelligenceService', () => {
  it('does not mix non-IRT observations into price analysis', async () => {
    const service = new PriceIntelligenceService({ match: () => [] } as any, {
      history: async () => [
        { amount: 100, unitPrice: 100, currency: 'IRT', observedAt: new Date('2026-08-01T00:00:00Z') },
        { amount: 999999, unitPrice: 999999, currency: 'USD', observedAt: new Date('2026-08-02T00:00:00Z') },
      ],
    } as any);
    const result = await service.analyze('milk');
    expect(result.current).toBe(100);
  });

  it('returns unavailable when only incompatible currency evidence exists', async () => {
    const service = new PriceIntelligenceService({ match: () => [] } as any, {
      history: async () => [{ amount: 99, currency: 'USD', observedAt: new Date('2026-08-02T00:00:00Z') }],
    } as any);
    await expect(service.analyze('milk')).resolves.toMatchObject({ recommendation: 'unavailable', trend: 'insufficient_data' });
  });
});
