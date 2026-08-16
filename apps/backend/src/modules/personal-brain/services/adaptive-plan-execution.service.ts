import { Injectable } from '@nestjs/common';

import {
  AdaptiveReplanResult,
  AdaptiveReplanningService,
} from './adaptive-replanning.service';
import { PlanExecutionService } from './plan-execution.service';
import { UnifiedDecision } from './unified-decision-engine.service';

export type AdaptivePlanExecutionResult = {
  execution: Awaited<ReturnType<PlanExecutionService['execute']>>;
  replanning: AdaptiveReplanResult;
};

@Injectable()
export class AdaptivePlanExecutionService {
  constructor(
    private readonly execution: PlanExecutionService,
    private readonly replanning: AdaptiveReplanningService,
  ) {}

  async execute(
    userId: string,
    decision: UnifiedDecision,
    context: Record<string, unknown> = {},
    now = new Date(),
  ): Promise<AdaptivePlanExecutionResult> {
    const execution = await this.execution.execute(userId, decision, context);
    const replanning = await this.replanning.evaluate(userId, execution, now);
    return { execution, replanning };
  }
}
