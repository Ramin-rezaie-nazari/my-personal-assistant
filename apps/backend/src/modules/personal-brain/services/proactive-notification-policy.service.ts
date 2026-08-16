import { Injectable } from '@nestjs/common';
import { SchedulePolicyService } from './schedule-policy.service';

@Injectable()
export class ProactiveNotificationPolicyService {
  constructor(private readonly policy: SchedulePolicyService) {}

  decide(input: {
    scheduledAt: Date;
    now?: Date;
    snoozeRate?: number;
    isHighPriority?: boolean;
  }) {
    const now = input.now ?? new Date();
    const policy = this.policy.getPolicy({ snoozeRate: input.snoozeRate ?? 0 });
    const minutesUntil = (input.scheduledAt.getTime() - now.getTime()) / 60000;
    const lead = input.isHighPriority
      ? Math.min(policy.notificationLeadMinutes, 5)
      : policy.notificationLeadMinutes;
    return {
      notify: minutesUntil >= 0 && minutesUntil <= lead,
      leadMinutes: lead,
      minutesUntil: Math.round(minutesUntil),
      reason:
        minutesUntil < 0
          ? 'scheduled time already passed'
          : minutesUntil <= lead
            ? 'inside notification window'
            : 'outside notification window',
    };
  }
}
