import { GlobalMarketScheduleService } from './global-market-schedule.service';

describe('GlobalMarketScheduleService', () => {
  const service = new GlobalMarketScheduleService();

  it('defaults to 03:30 local market time', () => {
    expect(service.config()).toMatchObject({ hour: 3, minute: 30, enabled: true });
  });

  it('resolves market timezones independently', () => {
    expect(service.timezoneForCountry('IR')).toBe('Asia/Tehran');
    expect(service.timezoneForCountry('JP')).toBe('Asia/Tokyo');
    expect(service.timezoneForCountry('ZZ')).toBe('UTC');
  });

  it('identifies countries whose local clock is exactly 03:30', () => {
    const instant = new Date('2026-08-17T00:00:00.000Z');
    const due = service.dueCountries(instant);
    expect(due).toEqual(expect.arrayContaining(['IR', 'AZ']));
    expect(due).not.toContain('JP');
  });

  it('computes the next 03:30 occurrence without requiring a UTC-fixed schedule', () => {
    const instant = new Date('2026-08-18T00:00:00.000Z');
    const next = service.nextOccurrence(instant, 'Asia/Tokyo');
    expect(next.toISOString()).toBe('2026-08-18T18:30:00.000Z');
  });
});
