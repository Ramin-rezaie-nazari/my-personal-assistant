import { NotificationDeduplicationService } from './notification-deduplication.service';

describe('NotificationDeduplicationService', () => {
  it('allows a new event and blocks the same event after send', () => {
    const service = new NotificationDeduplicationService();
    const event: any = {
      dedupeKey: 'task:t1:2026-08-12',
      type: 'next_action',
      title: 'Task',
      body: 'Start',
      priority: 'normal',
      scheduledFor: new Date().toISOString(),
    };
    expect(service.shouldSend(event).allowed).toBe(true);
    service.markSent(event);
    expect(service.shouldSend(event).allowed).toBe(false);
  });
});
