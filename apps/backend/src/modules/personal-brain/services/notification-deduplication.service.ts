import { Injectable } from '@nestjs/common';
import { ProactiveEvent } from './proactive-event-engine.service';

export type NotificationRecord = { dedupeKey: string; sentAt: string; eventType: string; taskId?: string };

@Injectable()
export class NotificationDeduplicationService {
  private readonly recent = new Map<string, NotificationRecord>();

  shouldSend(event: ProactiveEvent, now = new Date()) {
    const existing = this.recent.get(event.dedupeKey);
    if (!existing) return { allowed: true, reason: 'new event' };
    return { allowed: false, reason: 'duplicate event', existing };
  }

  markSent(event: ProactiveEvent, now = new Date()) {
    this.recent.set(event.dedupeKey, { dedupeKey: event.dedupeKey, sentAt: now.toISOString(), eventType: event.type, taskId: event.taskId });
  }

  clear(dedupeKey?: string) { if (dedupeKey) this.recent.delete(dedupeKey); else this.recent.clear(); }
}
