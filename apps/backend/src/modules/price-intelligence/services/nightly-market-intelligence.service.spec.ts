import { NightlyMarketIntelligenceService } from './nightly-market-intelligence.service';

describe('NightlyMarketIntelligenceService', () => {
  it('uses the scheduled local window and supports catch-up', () => {
    const service = new NightlyMarketIntelligenceService({ collect: async () => [] } as any, { record: () => [] } as any);
    expect(service.shouldRun(new Date('2026-08-12T03:30:00'), new Date('2026-08-11T03:30:00'))).toEqual({ run: true, reason: 'scheduled_window' });
    expect(service.shouldRun(new Date('2026-08-13T12:00:00'), new Date('2026-08-11T00:00:00'))).toEqual({ run: true, reason: 'catch_up_after_missed_window' });
  });

  it('runs without fabricating source data', async () => {
    const sources = { collectDetailed: jest.fn().mockResolvedValue({ prices: [], failedSourceIds: [], attemptedSourceIds: ['source-1'] }) };
    const persistence = {
      createRun: jest.fn().mockResolvedValue({ acquired: true, id: 'run-1' }),
      trackedProductKeys: jest.fn().mockResolvedValue(['ssd']),
      record: jest.fn().mockResolvedValue(undefined),
      finishRun: jest.fn().mockResolvedValue(undefined),
    };
    const service = new NightlyMarketIntelligenceService(sources as any, persistence as any);
    const result = await service.run(['ssd']);
    expect(sources.collectDetailed).toHaveBeenCalledWith(['ssd'], undefined);
    expect(result.status).toBe('failed');
    expect(result.collected).toBe(0);
    expect(persistence.createRun).toHaveBeenCalled();
    expect(persistence.finishRun).toHaveBeenCalledWith('run-1', expect.objectContaining({ status: 'failed', collected: 0 }));
  });
});
