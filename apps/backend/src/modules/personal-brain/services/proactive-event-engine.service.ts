import { Injectable } from '@nestjs/common';
import { ProactiveCoachService } from './proactive-coach.service';
import { ProactiveNotificationPolicyService } from './proactive-notification-policy.service';

export type ProactiveEventType = 'task_due_soon' | 'overdue_task' | 'schedule_recovery' | 'capacity_warning' | 'next_action';
export type ProactiveEvent = { type: ProactiveEventType; priority: 'critical' | 'high' | 'normal'; title: string; body: string; scheduledFor: string; dedupeKey: string; taskId?: string; reason: string };

@Injectable()
export class ProactiveEventEngineService {
  constructor(private readonly coach: ProactiveCoachService, private readonly notificationPolicy: ProactiveNotificationPolicyService) {}

  async buildEvents(userId: string, now = new Date()): Promise<ProactiveEvent[]> {
    const coach = await this.coach.getNextCoach(userId, now);
    const events: ProactiveEvent[] = [];
    const primary = coach.primary;
    if (primary.type === 'start_task' && primary.taskId) {
      const critical = primary.priority === 'critical';
      const delay = critical ? 0 : 10;
      events.push({ type: critical ? 'overdue_task' : 'next_action', priority: critical ? 'critical' : 'normal', title: primary.title, body: primary.message, scheduledFor: new Date(now.getTime() + delay * 60000).toISOString(), dedupeKey: `${primary.type}:${primary.taskId}:${now.toISOString().slice(0, 10)}`, taskId: primary.taskId, reason: primary.reason });
    } else if (primary.type === 'recover_schedule') {
      events.push({ type: 'schedule_recovery', priority: 'high', title: primary.title, body: primary.message, scheduledFor: now.toISOString(), dedupeKey: `recovery:${now.toISOString().slice(0, 10)}`, reason: primary.reason });
    } else if (primary.type === 'protect_capacity') {
      events.push({ type: 'capacity_warning', priority: 'high', title: primary.title, body: primary.message, scheduledFor: now.toISOString(), dedupeKey: `capacity:${now.toISOString().slice(0, 10)}`, reason: primary.reason });
    }
    return events;
  }
}
