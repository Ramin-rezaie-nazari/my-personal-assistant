import { Injectable } from '@nestjs/common';
import { FullDaySchedulerService } from './full-day-scheduler.service';
import { SchedulePolicyService } from './schedule-policy.service';

@Injectable()
export class ScheduleInsightsService {
  constructor(private readonly scheduler: FullDaySchedulerService, private readonly policy: SchedulePolicyService) {}

  async getInsights(userId: string, date = new Date()) {
    const plan = await this.scheduler.buildDay(userId, date);
    const policy = this.policy.getPolicy(plan.adaptive);
    const taskMinutes = plan.items.filter(i => i.type === 'task').reduce((sum, i) => sum + (new Date(i.end).getTime() - new Date(i.start).getTime()) / 60000, 0);
    const density = Math.round(taskMinutes / Math.max(1, plan.items.length));
    const recommendations: string[] = [];
    if (plan.unscheduled.length) recommendations.push(`${plan.unscheduled.length} item(s) need rescheduling or a lower priority.`);
    if (taskMinutes > policy.maxFocusedMinutes) recommendations.push('Your planned focus load is high; protect breaks or move lower-priority tasks.');
    if (plan.validation.overlapCount) recommendations.push('Schedule conflicts detected; replan before execution.');
    if (!recommendations.length) recommendations.push('Today\'s plan is balanced enough to execute as scheduled.');
    return { date: plan.date, policy, metrics: { taskMinutes: Math.round(taskMinutes), averageItemMinutes: density, utilization: Math.min(100, Math.round(taskMinutes / Math.max(1, policy.maxFocusedMinutes) * 100)) }, recommendations, plan };
  }
}
