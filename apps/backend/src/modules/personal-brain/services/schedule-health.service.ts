import { Injectable } from '@nestjs/common';
import { FullDaySchedulerService } from './full-day-scheduler.service';
import { SchedulePolicyService } from './schedule-policy.service';

@Injectable()
export class ScheduleHealthService {
  constructor(private readonly scheduler: FullDaySchedulerService, private readonly policy: SchedulePolicyService) {}

  async evaluate(userId: string, date = new Date()) {
    const plan = await this.scheduler.buildDay(userId, date);
    const policy = this.policy.getPolicy(plan.adaptive);
    const taskMinutes = plan.items.filter(i => i.type === 'task').reduce((n, i) => n + (new Date(i.end).getTime() - new Date(i.start).getTime()) / 60000, 0);
    const fixedMinutes = plan.items.filter(i => i.type !== 'task').reduce((n, i) => n + (new Date(i.end).getTime() - new Date(i.start).getTime()) / 60000, 0);
    const utilization = Math.round((taskMinutes / Math.max(1, policy.maxFocusedMinutes)) * 100);
    const penalties = plan.validation.overlapCount * 30 + plan.unscheduled.length * 10 + Math.max(0, utilization - 100) / 3;
    const score = Math.max(0, Math.min(100, 100 - penalties));
    const status = score >= 80 ? 'healthy' : score >= 55 ? 'strained' : 'overloaded';
    return {
      date: plan.date,
      status,
      score: Math.round(score),
      capacity: { taskMinutes: Math.round(taskMinutes), fixedMinutes: Math.round(fixedMinutes), maxFocusedMinutes: policy.maxFocusedMinutes, remainingMinutes: Math.max(0, policy.maxFocusedMinutes - taskMinutes), utilization },
      issues: { overlaps: plan.validation.overlapCount, unscheduled: plan.unscheduled.length },
      recommendation: status === 'healthy' ? 'execute as planned' : status === 'strained' ? 'protect breaks and move low-priority items' : 'replan and reduce today\'s load',
      plan,
    };
  }
}
