import { Injectable } from '@nestjs/common';
import { DecisionCandidate } from './unified-decision-engine.service';
import { DecisionActionAdapterService } from './decision-action-adapter.service';
import { DecisionExecutionGateService } from './decision-execution-gate.service';
import { DecisionFeedbackLoopService } from './decision-feedback-loop.service';
import { DecisionExecutionPolicyService } from './decision-execution-policy.service';
import { DecisionExecutionHistoryService } from './decision-execution-history.service';
import { ActionConfirmationIntelligenceService } from './action-confirmation-intelligence.service';
import { DecisionAuditService } from './decision-audit.service';
import { DecisionOutcomeLearningService } from './decision-outcome-learning.service';
export type DecisionExecutionStatus =
  | 'completed'
  | 'blocked'
  | 'unsupported'
  | 'failed'
  | 'dry_run'
  | 'pending_confirmation'
  | 'confirmation_invalid';
export type DecisionExecutionReceipt = {
  userId: string;
  decisionId: string;
  action: string;
  domain: DecisionCandidate['domain'];
  status: DecisionExecutionStatus;
  reason: string;
  result?: unknown;
  confirmationToken?: string;
  durationMs: number;
  attempts: number;
  recordedAt: number;
  policy: {
    timeoutMs: number;
    maxAttempts: number;
    retryDelayMs: number;
    dryRun: boolean;
  };
};
@Injectable()
export class DecisionExecutionCoordinatorService {
  constructor(
    private readonly gate: DecisionExecutionGateService,
    private readonly adapters: DecisionActionAdapterService,
    private readonly feedback: DecisionFeedbackLoopService,
    private readonly policy: DecisionExecutionPolicyService,
    private readonly history: DecisionExecutionHistoryService,
    private readonly confirmation: ActionConfirmationIntelligenceService,
    private readonly audit?: DecisionAuditService,
    private readonly outcomeLearning?: DecisionOutcomeLearningService,
  ) {}
  async execute(
    userId: string,
    candidate: DecisionCandidate,
    context: Record<string, unknown> = {},
  ): Promise<DecisionExecutionReceipt> {
    const t = Date.now(),
      base = {
        userId,
        decisionId: candidate.id,
        action: candidate.action,
        domain: candidate.domain,
        recordedAt: t,
      },
      resolved = this.policy.resolve(candidate, context),
      confirmation = this.confirmation.assess(userId, candidate, context);
    if (confirmation.required)
      return this.record({
        ...base,
        status: 'pending_confirmation',
        reason: confirmation.reason,
        confirmationToken: confirmation.token,
        durationMs: Date.now() - t,
        attempts: 0,
        policy: resolved,
      });
    return this.executeApproved(userId, candidate, context, resolved, t, base);
  }
  async confirmAndExecute(userId: string, token: string) {
    const p = this.confirmation.consume(userId, token);
    if (!p)
      return this.record({
        userId,
        decisionId: 'unknown',
        action: 'unknown',
        domain: 'conversation',
        status: 'confirmation_invalid',
        reason: 'invalid_or_expired_confirmation',
        durationMs: 0,
        attempts: 0,
        recordedAt: Date.now(),
        policy: {
          timeoutMs: 30000,
          maxAttempts: 1,
          retryDelayMs: 0,
          dryRun: false,
        },
      });
    const t = Date.now(),
      r = this.policy.resolve(p.candidate, p.context);
    return this.executeApproved(userId, p.candidate, p.context, r, t, {
      userId,
      decisionId: p.candidate.id,
      action: p.candidate.action,
      domain: p.candidate.domain,
      recordedAt: t,
    });
  }
  private async executeApproved(
    userId: string,
    c: DecisionCandidate,
    ctx: Record<string, unknown>,
    resolved: ReturnType<DecisionExecutionPolicyService['resolve']>,
    startedAt: number,
    base: Pick<
      DecisionExecutionReceipt,
      'userId' | 'decisionId' | 'action' | 'domain' | 'recordedAt'
    >,
  ): Promise<DecisionExecutionReceipt> {
    const gate = this.gate.open(userId, c);
    if (!gate.allowed)
      return this.record({
        ...base,
        status: 'blocked',
        reason: gate.reason,
        durationMs: Date.now() - startedAt,
        attempts: 0,
        policy: resolved,
      });
    try {
      const ex = await this.policy.run(c, resolved, () =>
        this.adapters.execute(c, ctx),
      );
      if (resolved.dryRun)
        return this.record({
          ...base,
          status: 'dry_run',
          reason: 'dry_run',
          durationMs: Date.now() - startedAt,
          attempts: 0,
          policy: resolved,
        });
      const ar = ex.result as { handled: boolean; result?: unknown };
      if (!ar?.handled) {
        this.gate.fail(userId, c, 'unsupported_action');
        this.feedback.record({ userId, candidate: c, outcome: 'skipped' });
        return this.record({
          ...base,
          status: 'unsupported',
          reason: 'unsupported_action',
          durationMs: Date.now() - startedAt,
          attempts: ex.attempts.length,
          policy: resolved,
        });
      }
      this.gate.complete(userId, c, ar.result);
      this.feedback.record({ userId, candidate: c, outcome: 'completed' });
      return this.record({
        ...base,
        status: 'completed',
        reason: 'action_executed',
        result: ar.result,
        durationMs: Date.now() - startedAt,
        attempts: ex.attempts.length,
        policy: resolved,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.gate.fail(userId, c, msg);
      this.feedback.record({ userId, candidate: c, outcome: 'failed' });
      return this.record({
        ...base,
        status: 'failed',
        reason: msg || 'action_failed',
        durationMs: Date.now() - startedAt,
        attempts: resolved.maxAttempts,
        policy: resolved,
      });
    }
  }
  private record(r: DecisionExecutionReceipt) {
    this.history.record(r);
    void this.audit
      ?.record({
        userId: r.userId,
        decisionId: r.decisionId,
        selectedIds:
          r.status === 'completed' || r.status === 'dry_run'
            ? [r.decisionId]
            : [],
        rejectedIds:
          r.status === 'unsupported' || r.status === 'failed'
            ? [r.decisionId]
            : [],
        blockedIds:
          r.status === 'blocked' ||
          r.status === 'pending_confirmation' ||
          r.status === 'confirmation_invalid'
            ? [r.decisionId]
            : [],
        reason: `${r.status}:${r.reason}`,
      })
      .catch(() => undefined);
    void this.outcomeLearning
      ?.record({
        userId: r.userId,
        decisionId: r.decisionId,
        outcome:
          r.status === 'failed' || r.status === 'unsupported'
            ? 'negative'
            : 'neutral',
        note: `${r.status}:${r.reason}`,
        source: 'system',
      })
      .catch(() => undefined);
    return r;
  }
}
