import { DecisionHistoryRetentionService } from './decision-history-retention.service';
describe('DecisionHistoryRetentionService', () => {
  it('supports finite and unlimited retention', () => { const service = new DecisionHistoryRetentionService(); const now = Date.UTC(2026,7,12); expect(service.cutoff('u1',now)).toBeLessThan(now); service.setPolicy('u1',{retention:'unlimited'}); expect(service.cutoff('u1',now)).toBeNull(); });
  it('supports 1 month and 3 month policies', () => { const service=new DecisionHistoryRetentionService(); const now=Date.UTC(2026,7,12); service.setPolicy('u1',{retention:'1_month'}); const one=service.cutoff('u1',now)!; service.setPolicy('u1',{retention:'3_months'}); const three=service.cutoff('u1',now)!; expect(now-one).toBeLessThan(now-three); });
  it('clamps recent-delete hours to a safe range', () => { const service=new DecisionHistoryRetentionService(); expect(service.setPolicy('u1',{retention:'3_months',deleteRecentActivityHours:99999}).deleteRecentActivityHours).toBe(8760); });
});
