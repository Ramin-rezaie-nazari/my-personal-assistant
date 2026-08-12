import { DecisionRateLimiterService } from './decision-rate-limiter.service';

describe('DecisionRateLimiterService', () => {
  it('limits repeated decisions inside a time window', () => {
    const service = new DecisionRateLimiterService();
    expect(service.allow('user:1', 2, 1000, 1000)).toBe(true);
    expect(service.allow('user:1', 2, 1000, 1100)).toBe(true);
    expect(service.allow('user:1', 2, 1000, 1200)).toBe(false);
    expect(service.remaining('user:1', 2, 1000, 1200)).toBe(0);
  });

  it('allows requests after the window rolls over', () => {
    const service = new DecisionRateLimiterService();
    service.allow('user:2', 1, 1000, 1000);
    expect(service.allow('user:2', 1, 1000, 2001)).toBe(true);
  });
});
