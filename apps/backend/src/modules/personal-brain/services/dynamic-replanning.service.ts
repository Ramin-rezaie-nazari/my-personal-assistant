import { Injectable } from '@nestjs/common';
import { FullDaySchedulerService } from './full-day-scheduler.service';

@Injectable()
export class DynamicReplanningService {
  constructor(private readonly scheduler: FullDaySchedulerService) {}

  async replanRemainingDay(userId: string, now = new Date()) {
    const plan = await this.scheduler.buildDay(userId, now);
    const remaining = plan.items.filter((item) => new Date(item.end) > now);
    const overdue = remaining.filter((item) => new Date(item.start) < now);
    const conflicts = plan.validation.overlapCount;
    return {
      generatedAt: now.toISOString(),
      date: plan.date,
      mode: 'remaining-day',
      items: remaining,
      overdue,
      unscheduled: plan.unscheduled,
      conflicts,
      requiresAttention:
        overdue.length > 0 || plan.unscheduled.length > 0 || conflicts > 0,
      nextAction: remaining.find((item) => new Date(item.start) >= now) ?? null,
    };
  }
}
