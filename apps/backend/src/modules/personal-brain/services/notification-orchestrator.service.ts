import { Injectable } from '@nestjs/common';
import { ProactiveEvent } from './proactive-event-engine.service';
import { ProactiveNotificationPolicyService } from './proactive-notification-policy.service';

export type NotificationPreferences = {
  enabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  minimumPriority?: 'critical' | 'high' | 'normal';
  language?: 'fa' | 'en';
};
export type NotificationDecision = {
  send: boolean;
  event: ProactiveEvent;
  reason: string;
  deliverAt: string;
};

@Injectable()
export class NotificationOrchestratorService {
  constructor(private readonly policy: ProactiveNotificationPolicyService) {}

  decide(
    event: ProactiveEvent,
    preferences: NotificationPreferences = {},
    now = new Date(),
  ): NotificationDecision {
    if (preferences.enabled === false)
      return {
        send: false,
        event,
        reason: 'notifications disabled',
        deliverAt: event.scheduledFor,
      };
    const rank = { critical: 0, high: 1, normal: 2 };
    const minimum = preferences.minimumPriority ?? 'normal';
    if (rank[event.priority] > rank[minimum])
      return {
        send: false,
        event,
        reason: 'below minimum notification priority',
        deliverAt: event.scheduledFor,
      };
    if (
      this.isQuietHours(
        now,
        preferences.quietHoursStart,
        preferences.quietHoursEnd,
      ) &&
      event.priority !== 'critical'
    ) {
      const deliverAt = this.nextQuietEnd(
        now,
        preferences.quietHoursEnd ?? '08:00',
      );
      return {
        send: false,
        event,
        reason: 'quiet hours',
        deliverAt: deliverAt.toISOString(),
      };
    }
    const scheduledAt = new Date(event.scheduledFor);
    const policy = this.policy.decide({
      scheduledAt,
      now,
      isHighPriority: event.priority === 'critical',
    });
    return {
      send: policy.notify || event.priority === 'critical',
      event,
      reason: policy.notify
        ? policy.reason
        : event.priority === 'critical'
          ? 'critical event bypasses lead window'
          : 'outside notification window',
      deliverAt: event.scheduledFor,
    };
  }

  private isQuietHours(now: Date, start?: string, end?: string) {
    if (!start || !end) return false;
    const minutes = now.getHours() * 60 + now.getMinutes();
    const s = this.toMinutes(start);
    const e = this.toMinutes(end);
    return s === e
      ? false
      : s < e
        ? minutes >= s && minutes < e
        : minutes >= s || minutes < e;
  }

  private nextQuietEnd(now: Date, end: string) {
    const result = new Date(now);
    const [h, m] = end.split(':').map(Number);
    result.setHours(h, m, 0, 0);
    if (result <= now) result.setDate(result.getDate() + 1);
    return result;
  }

  private toMinutes(value: string) {
    const [h, m] = value.split(':').map(Number);
    return h * 60 + m;
  }
}
