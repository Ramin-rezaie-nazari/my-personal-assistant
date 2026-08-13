import { Injectable } from '@nestjs/common';

export type ExecutionState = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type ExecutionRecord = { decisionId: string; state: ExecutionState; startedAt?: Date; completedAt?: Date; error?: string };

@Injectable()
export class DecisionExecutionStateService {
  private readonly records = new Map<string, ExecutionRecord>();
  start(decisionId: string) { return this.set(decisionId, { state: 'running', startedAt: new Date() }); }
  complete(decisionId: string) { return this.set(decisionId, { state: 'completed', completedAt: new Date() }); }
  fail(decisionId: string, error: string) { return this.set(decisionId, { state: 'failed', completedAt: new Date(), error }); }
  cancel(decisionId: string) { return this.set(decisionId, { state: 'cancelled', completedAt: new Date() }); }
  get(decisionId: string) { return this.records.get(decisionId) ?? null; }
  private set(decisionId: string, patch: Partial<Omit<ExecutionRecord, 'decisionId'>>) {
    const current = this.records.get(decisionId) ?? { decisionId, state: 'pending' as ExecutionState };
    const next: ExecutionRecord = { ...current, ...patch, decisionId };
    this.records.set(decisionId, next);
    return next;
  }
}
