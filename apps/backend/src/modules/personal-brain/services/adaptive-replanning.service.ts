import { Injectable } from '@nestjs/common';

import { DynamicReplanningService } from './dynamic-replanning.service';
import type { PlanExecutionResult } from './plan-execution.service';

export type AdaptiveReplanResult = {
  shouldReplan: boolean;
  reason: string;
  completed: string[];
  blocked: string[];
  failed: string[];
  nextAction: unknown;
  schedule: unknown;
};

@Injectable()
export class AdaptiveReplanningService {
  constructor(private readonly dynamicReplanning: DynamicReplanningService) {}

  async evaluate(
    userId: string,
    execution: PlanExecutionResult,
    now = new Date(),
  ): Promise<AdaptiveReplanResult> {
    const schedule = await this.dynamicReplanning.replanRemainingDay(
      userId,
      now,
    );

    const shouldReplan =
      execution.failed.length > 0 ||
      execution.blocked.length > 0 ||
      schedule.requiresAttention === true ||
      schedule.overdue.length > 0 ||
      schedule.conflicts > 0 ||
      schedule.unscheduled.length > 0;

    let reason = 'current-plan-still-valid';
    if (execution.failed.length > 0) reason = 'execution-failure-changed-plan';
    else if (execution.blocked.length > 0)
      reason = 'execution-blocked-needs-new-plan';
    else if (schedule.conflicts > 0) reason = 'schedule-conflict-detected';
    else if (schedule.overdue.length > 0)
      reason = 'overdue-items-require-replan';
    else if (schedule.unscheduled.length > 0)
      reason = 'unscheduled-work-requires-replan';

    return {
      shouldReplan,
      reason,
      completed: execution.completed,
      blocked: execution.blocked,
      failed: execution.failed,
      nextAction: schedule.nextAction,
      schedule,
    };
  }
}
