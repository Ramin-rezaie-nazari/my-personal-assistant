import { DecisionHistoryRetentionService } from './decision-history-retention.service';

describe('DecisionHistoryRetentionService', () => {
  it('uses a restart-stable configured retention policy', () => {
    const service = new DecisionHistoryRetentionService();
    const now = Date.UTC(2026, 7, 12);
    const cutoff = service.cutoff('u1', now);
    expect(cutoff).toBeLessThan(now);
    expect(service.getPolicy('u1').retention).toBe('3_months');
  });

  it('supports finite and unlimited retention as validated policy values', () => {
    const service = new DecisionHistoryRetentionService();
    expect(service.setPolicy('u1', { retention: 'unlimited' }).retention).toBe('unlimited');
    expect(service.setPolicy('u1', { retention: '1_month' }).retention).toBe('1_month');
    expect(service.setPolicy('u1', { retention: '3_months' }).retention).toBe('3_months');
  });

  it('clamps recent-delete hours to a safe range', () => {
    const service = new DecisionHistoryRetentionService();
    expect(
      service.setPolicy('u1', {
        retention: '3_months',
        deleteRecentActivityHours: 99999,
      }).deleteRecentActivityHours,
    ).toBe(8760);
  });
});
