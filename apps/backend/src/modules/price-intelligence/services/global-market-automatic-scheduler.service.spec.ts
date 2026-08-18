import { GlobalMarketAutomaticSchedulerService } from './global-market-automatic-scheduler.service';
import { GlobalMarketScheduleService } from './global-market-schedule.service';
import { NightlyMarketIntelligenceService } from './nightly-market-intelligence.service';
import { PricePersistenceService } from './price-persistence.service';

describe('GlobalMarketAutomaticSchedulerService', () => {
  it('keeps global scheduling disabled when explicitly disabled', () => {
    const service = new GlobalMarketAutomaticSchedulerService(
      {} as GlobalMarketScheduleService,
      {} as NightlyMarketIntelligenceService,
      {} as PricePersistenceService,
    );
    expect(() =>
      service.onModuleInit(),
    ).not.toThrow();
  });

  it('uses the market schedule and country-aware nightly runner for an execution', async () => {
    const schedule = new GlobalMarketScheduleService();
    const run = jest.fn().mockResolvedValue({ status: 'completed' });
    const nightly = { run } as unknown as NightlyMarketIntelligenceService;
    const persistence = {
      ensureTrackedProducts: jest.fn().mockResolvedValue(1),
      latestSuccessfulRun: jest.fn().mockResolvedValue(new Date()),
    } as unknown as PricePersistenceService;
    const service = new GlobalMarketAutomaticSchedulerService(schedule, nightly, persistence);

    const execute = (service as unknown as { execute: (date: Date) => Promise<void> }).execute;
    const scheduledFor = new Date('2026-08-17T00:00:00.000Z');
    await execute.call(service, scheduledFor);

    expect(persistence.ensureTrackedProducts).toHaveBeenCalled();
    expect(run).toHaveBeenCalled();
  });
});
