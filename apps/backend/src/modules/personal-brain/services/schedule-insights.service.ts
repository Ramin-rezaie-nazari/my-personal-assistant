import { Injectable } from '@nestjs/common';
import { FullDaySchedulerService } from './full-day-scheduler.service';
import { SchedulePolicyService } from './schedule-policy.service';
import { DailyCapacityService } from './daily-capacity.service';
import { ScheduleExplanationService } from './schedule-explanation.service';

@Injectable()
export class ScheduleInsightsService {
  constructor(
    private readonly scheduler: FullDaySchedulerService,
    private readonly policy: SchedulePolicyService,
    private readonly capacity: DailyCapacityService,
    private readonly explanation: ScheduleExplanationService,
  ) {}

  async getInsights(userId: string, date = new Date()) {
    const plan = await this.scheduler.buildDay(userId, date);
    const policy = this.policy.getPolicy(plan.adaptive);
    const taskMinutes = plan.items
      .filter((i) => i.type === 'task')
      .reduce(
        (sum, i) =>
          sum +
          (new Date(i.end).getTime() - new Date(i.start).getTime()) / 60000,
        0,
      );
    const density = Math.round(taskMinutes / Math.max(1, plan.items.length));
    const capacity = this.capacity.estimate({
      taskMinutes,
      maxFocusedMinutes: policy.maxFocusedMinutes,
      itemCount: plan.items.length,
      unscheduledCount: plan.unscheduled.length,
    });
    const recommendations: string[] = [];
    if (plan.unscheduled.length)
      recommendations.push(
        `${plan.unscheduled.length} item(s) need rescheduling or a lower priority.`,
      );
    if (capacity.overloaded)
      recommendations.push(
        'Your planned focus load is too high; protect breaks or move lower-priority tasks.',
      );
    if (plan.validation.overlapCount)
      recommendations.push(
        'Schedule conflicts detected; replan before execution.',
      );
    if (!recommendations.length)
      recommendations.push(
        "Today's plan is balanced enough to execute as scheduled.",
      );
    const explanations = plan.items.slice(0, 10).map((item) =>
      this.explanation.explain(item, {
        adaptiveMatch:
          item.type === 'task' && plan.adaptive.bestHours.length > 0,
        conflictAvoided: plan.validation.isConflictFree,
      }),
    );
    return {
      date: plan.date,
      policy,
      capacity,
      metrics: {
        taskMinutes: Math.round(taskMinutes),
        averageItemMinutes: density,
        utilization: capacity.utilization,
      },
      recommendations,
      explanations,
      plan,
    };
  }
}
