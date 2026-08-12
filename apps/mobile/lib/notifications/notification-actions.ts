import { NotificationPayload } from './notification-contract';

export type NotificationClientAction = 'open' | 'complete' | 'snooze' | 'dismiss';

export function buildNotificationFeedback(payload: NotificationPayload, action: NotificationClientAction, snoozeUntil?: string) {
  return {
    eventType: payload.eventType,
    dedupeKey: payload.dedupeKey,
    action,
    ...(snoozeUntil ? { snoozeUntil } : {}),
  };
}
