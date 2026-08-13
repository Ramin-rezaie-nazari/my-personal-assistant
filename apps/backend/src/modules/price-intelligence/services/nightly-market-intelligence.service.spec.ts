import { NightlyMarketIntelligenceService } from './nightly-market-intelligence.service';

describe('NightlyMarketIntelligenceService', () => {
  const emptySources = { collectDetailed: async () => ({ prices: [], failedSourceIds: [], attemptedSourceIds: [] }) } as any;
  it('uses the scheduled local window and supports catch-up', () => {
    const service = new NightlyMarketIntelligenceService(emptySources, { record: () => [] } as any);
    expect(service.shouldRun(new Date('2026-08-12T03:30:00'), new Date('2026-08-11T03:30:00'))).toEqual({ run: true, reason: 'scheduled_window' });
    expect(service.shouldRun(new Date('2026-08-13T12:00:00'), new Date('2026-08-11T00:00:00'))).toEqual({ run: true, reason: 'catch_up_after_missed_window' });
  });
  it('runs without fabricating source data', async () => {
    const service = new NightlyMarketIntelligenceService(emptySources, { record: jest.fn() } as any); const result = await service.run(['ssd']);
    expect(result.status).toBe('failed'); expect(result.collected).toBe(0);
  });
});
