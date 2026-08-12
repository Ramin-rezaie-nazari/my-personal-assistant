import { Injectable } from '@nestjs/common';
import { FullDaySchedulerService, ScheduleItem } from './full-day-scheduler.service';
import { ScheduleHealthService } from './schedule-health.service';

@Injectable()
export class ScheduleRecoveryService {
  constructor(private readonly scheduler: FullDaySchedulerService, private readonly health: ScheduleHealthService) {}

  async analyze(userId: string, now = new Date()) {
    const [plan, health] = await Promise.all([this.scheduler.buildDay(userId, now), this.health.evaluate(userId, now)]);
    const remaining = plan.items.filter(item => new Date(item.end) > now);
    const overdue = remaining.filter(item => new Date(item.start) < now);
    const lowPriority = [...remaining].filter(item => item.type === 'task').sort((a, b) => b.priority - a.priority);
    const actions: Array<{ type: string; id?: string; title?: string; reason: string }> = [];
    if (plan.validation.overlapCount > 0) actions.push({ type: 'rebuild_schedule', reason: 'existing schedule contains conflicts' });
    if (health.capacity.utilization >= 100 && lowPriority.length) {
      for (const item of lowPriority.slice(0, Math.min(3, lowPriority.length))) actions.push({ type: 'consider_move', id: item.id, title: item.title, reason: 'lower-priority task can protect focus capacity' });
    }
    for (const item of plan.unscheduled.slice(0, 5)) actions.push({ type: 'reschedule', id: item.id, title: item.title, reason: item.reason });
    if (overdue.length) actions.unshift({ type: 'attention', id: overdue[0].id, title: overdue[0].title, reason: 'scheduled start has passed without completion' });
    const nextAction = remaining.filter(item => new Date(item.start) >= now).sort((a, b) => a.start.localeCompare(b.start))[0] ?? null;
    return { generatedAt: now.toISOString(), date: plan.date, severity: health.status, requiresRecovery: actions.length > 0, nextAction, overdue, actions, health: { score: health.score, utilization: health.capacity.utilization, remainingMinutes: health.capacity.remainingMinutes } };
  }
}
