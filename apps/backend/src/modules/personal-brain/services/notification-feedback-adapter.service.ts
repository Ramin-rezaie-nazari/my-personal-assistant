import { Injectable } from '@nestjs/common';
import {
  NotificationFeedbackService,
  NotificationAction,
} from './notification-feedback.service';

export type NotificationClientAction =
  'open' | 'complete' | 'snooze' | 'dismiss';

@Injectable()
export class NotificationFeedbackAdapterService {
  constructor(private readonly feedback: NotificationFeedbackService) {}

  recordClientAction(input: {
    userId: string;
    eventType: string;
    dedupeKey: string;
    action: NotificationClientAction;
    snoozeUntil?: string;
    at?: string;
  }) {
    const actionMap: Record<NotificationClientAction, NotificationAction> = {
      open: 'opened',
      complete: 'completed',
      snooze: 'snoozed',
      dismiss: 'dismissed',
    };
    return this.feedback.record({ ...input, action: actionMap[input.action] });
  }
}
