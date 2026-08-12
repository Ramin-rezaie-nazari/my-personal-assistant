import { AdaptiveNotificationDecisionService } from './adaptive-notification-decision.service';
import { NotificationAdaptationService } from './notification-adaptation.service';

describe('AdaptiveNotificationDecisionService', () => {
  const service = new AdaptiveNotificationDecisionService(new NotificationAdaptationService());
  const base = { eventType: 'next_action', engagementScore: 0.1, resistanceScore: 0.9, sampleSize: 10, confidence: 0.9 } as any;

  it('suppresses non-critical notifications under severe fatigue', () => {
    const result = service.decide({ signal: base, basePriority: 'normal', scheduledAt: new Date('2026-08-12T10:00:00Z') });
    expect(result.notify).toBe(false);
    expect(result.action).toBe('reduce_frequency');
  });

  it('never suppresses a critical notification', () => {
    const result = service.decide({ signal: base, basePriority: 'critical', scheduledAt: new Date('2026-08-12T10:00:00Z') });
    expect(result.notify).toBe(true);
    expect(result.effectivePriority).toBe('critical');
  });
});
