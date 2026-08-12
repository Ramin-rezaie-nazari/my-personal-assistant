import { Injectable } from '@nestjs/common';
import { DecisionCandidate } from './unified-decision-engine.service';
import { DecisionActionAdapterService } from './decision-action-adapter.service';
import { DecisionExecutionGateService } from './decision-execution-gate.service';
import { DecisionFeedbackLoopService } from './decision-feedback-loop.service';

export type DecisionExecutionStatus = 'completed' | 'blocked' | 'unsupported' | 'failed';

export type DecisionExecutionReceipt = {
  userId: string;
  decisionId: string;
  action: string;
  domain: DecisionCandidate['domain'];
  status: DecisionExecutionStatus;
  reason: string;
  result?: unknown;
  durationMs: number;
};

@Injectable()
export class DecisionExecutionCoordinatorService {
  constructor(
    private readonly gate: DecisionExecutionGateService,
    private readonly adapters: DecisionActionAdapterService,
    private readonly feedback: DecisionFeedbackLoopService,
  ) {}

  async execute(userId: string, candidate: DecisionCandidate, context: Record<string, unknown> = {}): Promise<DecisionExecutionReceipt> {
    const startedAt = Date.now();
    const base = { userId, decisionId: candidate.id, action: candidate.action, domain: candidate.domain };
    const gate = this.gate.open(userId, candidate);

    if (!gate.allowed) {
      return { ...base, status: 'blocked', reason: gate.reason, durationMs: Date.now() - startedAt };
    }

    try {
      const execution = await this.adapters.execute(candidate, context);
      if (!execution.handled) {
        this.gate.fail(userId, candidate, 'unsupported_action');
        this.feedback.record({ userId, candidate, outcome: 'skipped' });
        return { ...base, status: 'unsupported', reason: 'unsupported_action', durationMs: Date.now() - startedAt };
      }

      this.gate.complete(userId, candidate, execution.result);
      this.feedback.record({ userId, candidate, outcome: 'completed' });
      return { ...base, status: 'completed', reason: 'action_executed', result: execution.result, durationMs: Date.now() - startedAt };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.gate.fail(userId, candidate, message);
      this.feedback.record({ userId, candidate, outcome: 'failed' });
      return { ...base, status: 'failed', reason: message || 'action_failed', durationMs: Date.now() - startedAt };
    }
  }
}
