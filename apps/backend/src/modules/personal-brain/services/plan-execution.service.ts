import { Injectable, Optional } from '@nestjs/common';
import { DecisionExecutionCoordinatorService } from './decision-execution-coordinator.service';
import type { DecisionExecutionReceipt } from './decision-execution-coordinator.service';
import { DecisionExecutionPlannerService } from './decision-execution-planner.service';
import type { ExecutionStep } from './decision-execution-planner.service';
import { DecisionExecutionStateService } from './decision-execution-state.service';
import { PersistentPlanStateService } from './persistent-plan-state.service';
import { UnifiedDecision } from './unified-decision-engine.service';

export type PlanExecutionStatus = 'completed' | 'partial' | 'blocked' | 'failed';
export type PlanExecutionResult = { planId: string; status: PlanExecutionStatus; steps: Array<ExecutionStep & { status: DecisionExecutionReceipt['status']; receipt?: DecisionExecutionReceipt }>; completed: string[]; blocked: string[]; failed: string[]; nextStep: string | null; reason: string };

@Injectable()
export class PlanExecutionService {
  constructor(private readonly planner: DecisionExecutionPlannerService, private readonly coordinator: DecisionExecutionCoordinatorService, private readonly state: DecisionExecutionStateService, @Optional() private readonly persistentState?: PersistentPlanStateService) {}

  async execute(userId: string, decision: UnifiedDecision, context: Record<string, unknown> = {}): Promise<PlanExecutionResult> {
    const plan = this.planner.plan(decision);
    const planId = String(context.planId ?? `plan:${plan.map((item) => item.candidateId).join('|')}`);
    const existing = await this.persistentState?.resume(userId, planId);
    const results: PlanExecutionResult['steps'] = [];
    const completed = existing?.completed ?? [];
    const blocked = existing?.blocked ?? [];
    const failed = existing?.failed ?? [];
    const save = async (payload: Parameters<PersistentPlanStateService['save']>[0]) => { if (this.persistentState) await this.persistentState.save(payload); };
    await save({ planId, userId, status: existing?.status === 'completed' ? 'completed' : 'running', stepIds: plan.map((item) => item.candidateId), completed, blocked, failed, currentStep: existing?.currentStep ?? null, updatedAt: new Date() });

    for (const step of plan) {
      const candidate = decision.selected.find((item) => item.id === step.candidateId); if (!candidate || completed.includes(step.candidateId)) continue;
      const dependenciesMet = step.dependsOn.every((dependency) => completed.includes(dependency));
      if (!dependenciesMet) { if (!blocked.includes(step.candidateId)) blocked.push(step.candidateId); results.push({ ...step, status: 'blocked' }); await save({ planId, userId, status: 'blocked', stepIds: plan.map((item) => item.candidateId), completed, blocked, failed, currentStep: step.candidateId, updatedAt: new Date() }); continue; }
      await save({ planId, userId, status: 'running', stepIds: plan.map((item) => item.candidateId), completed, blocked, failed, currentStep: step.candidateId, updatedAt: new Date() });
      this.state.start(step.candidateId);
      const receipt = await this.coordinator.execute(userId, candidate, context); const normalized = receipt.status;
      results.push({ ...step, status: normalized, receipt });
      if (normalized === 'completed' || normalized === 'dry_run') { this.state.complete(step.candidateId); if (!completed.includes(step.candidateId)) completed.push(step.candidateId); await save({ planId, userId, status: 'running', stepIds: plan.map((item) => item.candidateId), completed, blocked, failed, currentStep: null, updatedAt: new Date() }); continue; }
      if (normalized === 'pending_confirmation') { this.state.cancel(step.candidateId); if (!blocked.includes(step.candidateId)) blocked.push(step.candidateId); await save({ planId, userId, status: 'blocked', stepIds: plan.map((item) => item.candidateId), completed, blocked, failed, currentStep: step.candidateId, updatedAt: new Date() }); continue; }
      this.state.fail(step.candidateId, receipt.reason); if (!failed.includes(step.candidateId)) failed.push(step.candidateId); await save({ planId, userId, status: completed.length ? 'partial' : 'failed', stepIds: plan.map((item) => item.candidateId), completed, blocked, failed, currentStep: step.candidateId, updatedAt: new Date() }); break;
    }
    const unfinished = plan.map((item) => item.candidateId).filter((id) => !completed.includes(id) && !blocked.includes(id) && !failed.includes(id));
    const status: PlanExecutionStatus = failed.length ? completed.length ? 'partial' : 'failed' : blocked.length || unfinished.length ? completed.length ? 'partial' : 'blocked' : 'completed';
    const reason = failed.length ? 'plan_stopped_after_step_failure' : blocked.length ? 'plan_waiting_on_blocked_step' : unfinished.length ? 'plan_waiting_for_resume' : 'plan_completed';
    await save({ planId, userId, status, stepIds: plan.map((item) => item.candidateId), completed, blocked, failed, currentStep: unfinished[0] ?? null, updatedAt: new Date() });
    return { planId, status, steps: results, completed, blocked, failed, nextStep: unfinished[0] ?? null, reason };
  }
}
