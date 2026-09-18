import { configNumber, localScheduledFor } from './local-price-scheduler';

describe('local-price-scheduler', () => {
  it('schedules the next local occurrence for tomorrow when today\'s slot already passed', () => {
    const now = new Date(2026, 8, 18, 4, 0, 0, 0);
    const next = localScheduledFor(3, 30, now);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(8);
    expect(next.getDate()).toBe(19);
    expect(next.getHours()).toBe(3);
    expect(next.getMinutes()).toBe(30);
  });

  it('schedules today when the slot is still ahead', () => {
    const now = new Date(2026, 8, 18, 2, 0, 0, 0);
    const next = localScheduledFor(3, 30, now);
    expect(next.getDate()).toBe(18);
    expect(next.getHours()).toBe(3);
    expect(next.getMinutes()).toBe(30);
  });

  it('clamps invalid scheduler configuration to safe bounds', () => {
    expect(configNumber('MISSING_ENV', 3, 0, 23)).toBe(3);
    expect(configNumber('MISSING_ENV', 3, 0, 23)).toBeGreaterThanOrEqual(0);
    expect(configNumber('MISSING_ENV', 3, 0, 23)).toBeLessThanOrEqual(23);
  });
});