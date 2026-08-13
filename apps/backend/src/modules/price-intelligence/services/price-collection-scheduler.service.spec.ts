import { PriceCollectionSchedulerService } from './price-collection-scheduler.service';

describe('PriceCollectionSchedulerService', () => {
  it('uses the 03:30 default schedule', () => {
    const nightly = { shouldRun: jest.fn().mockReturnValue({ run: false, reason: 'scheduled_window' }) } as any;
    const service = new PriceCollectionSchedulerService(nightly);
    expect(service.schedule()).toMatchObject({ hour: 3, minute: 30, enabled: true });
  });

  it('allows a user timezone override without changing the 03:30 window', () => {
    const nightly = { shouldRun: jest.fn().mockReturnValue({ run: true, reason: 'catch_up_after_missed_window' }) } as any;
    const service = new PriceCollectionSchedulerService(nightly);
    expect(service.schedule({ timezone: 'Europe/Berlin' })).toMatchObject({ hour: 3, minute: 30, timezone: 'Europe/Berlin' });
    expect(service.shouldRun(new Date('2026-08-13T01:30:00.000Z'))).toEqual({ run: true, reason: 'scheduled_or_catch_up' });
  });
});
