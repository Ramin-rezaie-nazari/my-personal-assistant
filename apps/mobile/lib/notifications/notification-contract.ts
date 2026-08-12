export const NOTIFICATION_CONTRACT_VERSION = 1 as const;

export type NotificationEntity = 'task' | 'workout' | 'reminder' | 'nutrition' | 'coach' | 'schedule';
export type NotificationAction = 'open' | 'complete' | 'snooze' | 'dismiss';

export type NotificationPayload = {
  version: typeof NOTIFICATION_CONTRACT_VERSION;
  eventId: string;
  eventType: string;
  entity: NotificationEntity;
  action?: NotificationAction;
  screen: string;
  entityId?: string;
  taskId?: string;
  workoutId?: string;
  reminderId?: string;
  locale: 'fa' | 'en';
  dedupeKey: string;
};

export function parseNotificationPayload(input: unknown): NotificationPayload | null {
  if (!input || typeof input !== 'object') return null;
  const value = input as Record<string, unknown>;
  if (value.version !== NOTIFICATION_CONTRACT_VERSION) return null;
  if (typeof value.eventId !== 'string' || typeof value.eventType !== 'string') return null;
  if (!['task', 'workout', 'reminder', 'nutrition', 'coach', 'schedule'].includes(String(value.entity))) return null;
  if (typeof value.screen !== 'string' || !['fa', 'en'].includes(String(value.locale))) return null;
  if (typeof value.dedupeKey !== 'string') return null;
  return value as unknown as NotificationPayload;
}
