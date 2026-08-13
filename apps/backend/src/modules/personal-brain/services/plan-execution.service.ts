import { Injectable } from '@nestjs/common';

import { DecisionExecutionCoordinatorService, DecisionExecutionReceipt } from './decision-execution-coordinator.service';
import { DecisionExecutionPlannerService, ExecutionStep } from './decision-execution-planner.service';
import { DecisionExecutionStateService } from './decision-execution-state.service';
import { UnifiedDecision } from './unified-decision-engine.service';

export type PlanExecutionStatus = 'completed' | 'partial' | 'blocked' | 'failed';

export type PlanExecutionResult = {
  status: PlanExecutionStatus;
  steps: Array<ExecutionStep & { status: DecisionExecutionReceipt['status']; receipt?: DecisionExecutionReceipt }>;
  completed: string[];
  blocked: string[];
  failed: string[];
  nextStep: string | null;
  reason: string;
};

@Injectable()
export class PlanExecutionService {
  constructor(
    private readonly planner: DecisionExecutionPlannerService,
    private readonly coordinator: DecisionExecutionCoordinatorService,
    private readonly state: DecisionExecutionStateService,
  ) {}

  async execute(userId: string, decision: UnifiedDecision, context: Record<string, unknown> = {}): Promise<PlanExecutionResult> {
    const plan = this.planner.plan(decision);
    const results: PlanExecutionResult['steps'] = [];
    const completed: string[] = [];
    const blocked: string[] = [];
    const failed: string[] = [];

    for (const step of plan) {
      const candidate = decision.selected.find((item) => item.id === step.candidateId);
      if (!candidate) continue;

      const dependenciesMet = step.dependsOn.every((dependency) => completed.includes(dependency));
      if (!dependenciesMet) {
        blocked.push(step.candidateId);
        results.push({ ...step, status: 'blocked' });
        continue;
      }

      this.state.start(step.candidateId);
      const receipt = await this.coordinator.execute(userId, candidate, context);
      const normalized = receipt.status;
      results.push({ ...step, status: normalized, receipt });

      if (normalized === 'completed' || normalized === 'dry_run') {
        this.state.complete(step.candidateId);
        completed.push(step.candidateId);
        continue;
      }

      if (normalized === 'pending_confirmation') {
        this.state.cancel(step.candidateId);
        blocked.push(step.candidateId);
        continue;
      }

      this.state.fail(step.candidateId, receipt.reason);
      failed.push(step.candidateId);
      break;
    }

    const unfinished = plan.map((item) => item.candidateId).filter((id) => !completed.includes(id) && !blocked.includes(id) && !failed.includes(id));
    const status: PlanExecutionStatus = failed.length
      ? completed.length ? 'partial' : 'failed'
      : blocked.length
        ? completed.length ? 'partial' : 'blocked'
        : 'completed';

    return {
      status,
      steps: results,
      completed,
      blocked,
      failed,
      nextStep: unfinished[0] ?? null,
      reason: failed.length
        ? 'plan_stopped_after_step_failure'
        : blocked.length
          ? 'plan_waiting_on_blocked_step'
          : 'plan_completed',
    };
  }
}
