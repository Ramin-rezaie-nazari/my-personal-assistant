import { parseNotificationPayload } from './notification-contract';

describe('notification contract', () => {
  const valid = { version: 1, eventId: 'e1', eventType: 'next_action', entity: 'task', screen: 'task', taskId: 't1', locale: 'fa', dedupeKey: 'task:t1' };

  it('accepts a valid versioned payload', () => {
    expect(parseNotificationPayload(valid)?.taskId).toBe('t1');
  });

  it('rejects malformed or future-version payloads', () => {
    expect(parseNotificationPayload({ ...valid, version: 2 })).toBeNull();
    expect(parseNotificationPayload({ ...valid, locale: 'de' })).toBeNull();
    expect(parseNotificationPayload({ ...valid, entity: 'unknown' })).toBeNull();
  });
});
