import { Injectable } from '@nestjs/common';
import { DecisionCandidate } from './unified-decision-engine.service';
import { DecisionGuardrailService } from './decision-guardrail.service';
import { DecisionExecutionStateService } from './decision-execution-state.service';

export type ExecutionGateResult = {
  allowed: boolean;
  key: string;
  reason: string;
  state?: string;
};

@Injectable()
export class DecisionExecutionGateService {
  constructor(
    private readonly guardrails: DecisionGuardrailService,
    private readonly state: DecisionExecutionStateService,
  ) {}

  open(
    userId: string,
    candidate: DecisionCandidate,
    now = Date.now(),
  ): ExecutionGateResult {
    const guard = this.guardrails.check(userId, candidate, now);
    if (!guard.allowed) return guard;
    const execution = this.state.start(guard.key);
    return {
      allowed: true,
      key: guard.key,
      reason: 'execution_started',
      state: execution.state,
    };
  }

  complete(userId: string, candidate: DecisionCandidate, result: unknown) {
    const key = `${userId}:${candidate.id}:${candidate.action}`;
    const execution = this.state.complete(key);
    this.guardrails.remember(userId, candidate, result);
    return execution;
  }

  fail(userId: string, candidate: DecisionCandidate, error: string) {
    const key = `${userId}:${candidate.id}:${candidate.action}`;
    return this.state.fail(key, error);
  }

  cancel(userId: string, candidate: DecisionCandidate) {
    const key = `${userId}:${candidate.id}:${candidate.action}`;
    return this.state.cancel(key);
  }
}
