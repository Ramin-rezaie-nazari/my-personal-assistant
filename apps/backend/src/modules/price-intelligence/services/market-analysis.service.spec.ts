import { MarketAnalysisService } from './market-analysis.service';

describe('MarketAnalysisService', () => {
  it('detects a meaningful falling trend and buy opportunity', () => {
    const history = { forProduct: () => [
      { productKey: 'ssd', amount: 100, observedAt: new Date('2026-08-01T03:30:00Z') },
      { productKey: 'ssd', amount: 95, observedAt: new Date('2026-08-05T03:30:00Z') },
      { productKey: 'ssd', amount: 80, observedAt: new Date('2026-08-12T03:30:00Z') },
    ] } as any;
    const service = new MarketAnalysisService(history);
    const result = service.analyze('ssd', new Date('2026-08-12T04:00:00Z'));
    expect(result.trend).toBe('falling');
    expect(result.current).toBe(80);
  });

  it('reports insufficient data instead of inventing a trend', () => {
    const service = new MarketAnalysisService({ forProduct: () => [] } as any);
    expect(service.analyze('unknown').recommendation).toBe('unavailable');
  });
});
