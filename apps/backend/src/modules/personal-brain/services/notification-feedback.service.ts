import { Injectable } from '@nestjs/common';

export type NotificationAction = 'delivered' | 'opened' | 'completed' | 'snoozed' | 'dismissed' | 'ignored';
export type NotificationFeedback = { userId: string; dedupeKey: string; eventType: string; action: NotificationAction; at: string; snoozeUntil?: string };
export type NotificationSignal = {
  sampleSize: number;
  snoozed: number;
  dismissed: number;
  ignored: number;
  engaged: number;
  resistanceScore: number;
  engagementScore: number;
};

@Injectable()
export class NotificationFeedbackService {
  private readonly feedback = new Map<string, NotificationFeedback[]>();

  record(input: Omit<NotificationFeedback, 'at'> & { at?: string }) {
    const item = { ...input, at: input.at ?? new Date().toISOString() };
    const list = this.feedback.get(input.userId) ?? [];
    list.push(item);
    if (list.length > 100) list.splice(0, list.length - 100);
    this.feedback.set(input.userId, list);
    return item;
  }

  getRecent(userId: string, limit = 20) {
    return (this.feedback.get(userId) ?? []).slice(-Math.max(1, Math.min(limit, 100))).reverse();
  }

  getSignal(userId: string, eventType: string): NotificationSignal {
    const items = (this.feedback.get(userId) ?? []).filter(x => x.eventType === eventType);
    const snoozed = items.filter(x => x.action === 'snoozed').length;
    const dismissed = items.filter(x => x.action === 'dismissed').length;
    const ignored = items.filter(x => x.action === 'ignored').length;
    const engaged = items.filter(x => x.action === 'opened' || x.action === 'completed').length;
    const resistanceScore = items.length ? (snoozed + dismissed + ignored) / items.length : 0;
    const engagementScore = items.length ? engaged / items.length : 0;
    return { sampleSize: items.length, snoozed, dismissed, ignored, engaged, resistanceScore, engagementScore };
  }
}
