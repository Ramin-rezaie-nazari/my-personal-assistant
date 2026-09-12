import { MarketAnalysisService } from './market-analysis.service';

describe('MarketAnalysisService', () => {
  it('detects a meaningful falling trend from durable history', async () => {
    const persistence = {
      history: async () => [
        { amount: 100, observedAt: new Date('2026-08-01T03:30:00Z'), currency: 'IRT' },
        { amount: 95, observedAt: new Date('2026-08-05T03:30:00Z'), currency: 'IRT' },
        { amount: 80, observedAt: new Date('2026-08-12T03:30:00Z'), currency: 'IRT' },
      ],
    } as any;
    const service = new MarketAnalysisService(persistence);
    const result = await service.analyze('ssd', new Date('2026-08-12T04:00:00Z'));
    expect(result.trend).toBe('falling');
    expect(result.current).toBe(80);
  });

  it('does not mix incompatible currencies into an insight', async () => {
    const persistence = {
      history: async () => [
        { amount: 100, observedAt: new Date('2026-08-01T03:30:00Z'), currency: 'IRT' },
        { amount: 999, observedAt: new Date('2026-08-10T03:30:00Z'), currency: 'USD' },
      ],
    } as any;
    const service = new MarketAnalysisService(persistence);
    const result = await service.analyze('ssd', new Date('2026-08-12T04:00:00Z'));
    expect(result.current).toBe(100);
  });

  it('reports insufficient data instead of inventing a trend', async () => {
    const service = new MarketAnalysisService({ history: async () => [] } as any);
    await expect(service.analyze('unknown')).resolves.toMatchObject({ recommendation: 'unavailable' });
  });
});
