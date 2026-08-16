import { NotificationFeedbackService } from './notification-feedback.service';

describe('NotificationFeedbackService', () => {
  it('aggregates resistance signals by event type', () => {
    const service = new NotificationFeedbackService();
    const base = {
      userId: 'u1',
      dedupeKey: 'task:t1',
      eventType: 'next_action',
    };
    service.record({ ...base, action: 'snoozed' });
    service.record({ ...base, action: 'dismissed' });
    service.record({ ...base, action: 'completed' });
    const signal = service.getSignal('u1', 'next_action');
    expect(signal.sampleSize).toBe(3);
    expect(signal.resistanceScore).toBeCloseTo(2 / 3);
    expect(signal.engaged).toBe(1);
  });
});
