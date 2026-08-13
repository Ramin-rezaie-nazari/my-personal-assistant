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

export type DecisionExecutionStatus = 'completed' | 'blocked' | 'unsupported' | 'failed' | 'dry_run' | 'pending_confirmation' | 'confirmation_invalid';

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
  policy: { timeoutMs: number; maxAttempts: number; retryDelayMs: number; dryRun: boolean };
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
    private readonly audit: DecisionAuditService,
    private readonly outcomeLearning: DecisionOutcomeLearningService,
  ) {}

  async execute(userId: string, candidate: DecisionCandidate, context: Record<string, unknown> = {}): Promise<DecisionExecutionReceipt> {
    const startedAt = Date.now();
    const base = { userId, decisionId: candidate.id, action: candidate.action, domain: candidate.domain, recordedAt: startedAt };
    const resolved = this.policy.resolve(candidate, context);
    const receiptPolicy = this.normalizePolicy(resolved);
    const confirmation = this.confirmation.assess(userId, candidate, context);
    if (confirmation.required) {
      return this.record({
        ...base,
        status: 'pending_confirmation',
        reason: confirmation.reason,
        confirmationToken: confirmation.token,
        durationMs: Date.now() - startedAt,
        attempts: 0,
        policy: receiptPolicy,
      });
    }
    return this.executeApproved(userId, candidate, context, resolved, startedAt, base);
  }

  async confirmAndExecute(userId: string, token: string): Promise<DecisionExecutionReceipt> {
    const pending = this.confirmation.consume(userId, token);
    if (!pending) {
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
        policy: { timeoutMs: 30_000, maxAttempts: 1, retryDelayMs: 0, dryRun: false },
      });
    }
    const startedAt = Date.now();
    const resolved = this.policy.resolve(pending.candidate, pending.context);
    return this.executeApproved(userId, pending.candidate, pending.context, resolved, startedAt, {
      userId,
      decisionId: pending.candidate.id,
      action: pending.candidate.action,
      domain: pending.candidate.domain,
      recordedAt: startedAt,
    });
  }

  private async executeApproved(
    userId: string,
    candidate: DecisionCandidate,
    context: Record<string, unknown>,
    resolved: ReturnType<DecisionExecutionPolicyService['resolve']>,
    startedAt: number,
    base: Pick<DecisionExecutionReceipt, 'userId' | 'decisionId' | 'action' | 'domain' | 'recordedAt'>,
  ): Promise<DecisionExecutionReceipt> {
    const gate = this.gate.open(userId, candidate);
    const receiptPolicy = this.normalizePolicy(resolved);
    if (!gate.allowed) return this.record({ ...base, status: 'blocked', reason: gate.reason, durationMs: Date.now() - startedAt, attempts: 0, policy: receiptPolicy });

    try {
      const execution = await this.policy.run(candidate, receiptPolicy, () => this.adapters.execute(candidate, context));
      if (receiptPolicy.dryRun) return this.record({ ...base, status: 'dry_run', reason: 'dry_run', durationMs: Date.now() - startedAt, attempts: 0, policy: receiptPolicy });
      const actionResult = execution.result as { handled: boolean; result?: unknown };
      if (!actionResult?.handled) {
        this.gate.fail(userId, candidate, 'unsupported_action');
        this.feedback.record({ userId, candidate, outcome: 'skipped' });
        return this.record({ ...base, status: 'unsupported', reason: 'unsupported_action', durationMs: Date.now() - startedAt, attempts: execution.attempts.length, policy: receiptPolicy });
      }
      this.gate.complete(userId, candidate, actionResult.result);
      this.feedback.record({ userId, candidate, outcome: 'completed' });
      return this.record({ ...base, status: 'completed', reason: 'action_executed', result: actionResult.result, durationMs: Date.now() - startedAt, attempts: execution.attempts.length, policy: receiptPolicy });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.gate.fail(userId, candidate, message);
      this.feedback.record({ userId, candidate, outcome: 'failed' });
      return this.record({ ...base, status: 'failed', reason: message || 'action_failed', durationMs: Date.now() - startedAt, attempts: receiptPolicy.maxAttempts, policy: receiptPolicy });
    }
  }

  private normalizePolicy(policy: ReturnType<DecisionExecutionPolicyService['resolve']>): DecisionExecutionReceipt['policy'] {
    return {
      timeoutMs: policy.timeoutMs,
      maxAttempts: policy.maxAttempts,
      retryDelayMs: policy.retryDelayMs,
      dryRun: policy.dryRun === true,
    };
  }

  private record(receipt: DecisionExecutionReceipt): DecisionExecutionReceipt {
    this.history.record(receipt);
    void this.audit.record({
      userId: receipt.userId,
      decisionId: receipt.decisionId,
      selectedIds: receipt.status === 'completed' || receipt.status === 'dry_run' ? [receipt.decisionId] : [],
      rejectedIds: receipt.status === 'unsupported' || receipt.status === 'failed' ? [receipt.decisionId] : [],
      blockedIds: receipt.status === 'blocked' || receipt.status === 'pending_confirmation' || receipt.status === 'confirmation_invalid' ? [receipt.decisionId] : [],
      reason: `${receipt.status}:${receipt.reason}`,
    }).catch(() => undefined);

    const systemOutcome = receipt.status === 'failed' || receipt.status === 'unsupported'
      ? 'negative'
      : receipt.status === 'completed'
        ? 'neutral'
        : 'neutral';
    void this.outcomeLearning.record({
      userId: receipt.userId,
      decisionId: receipt.decisionId,
      outcome: systemOutcome,
      note: `${receipt.status}:${receipt.reason}`,
      source: 'system',
    }).catch(() => undefined);

    return receipt;
  }
}
