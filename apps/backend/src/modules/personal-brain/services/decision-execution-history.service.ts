import { Injectable } from '@nestjs/common';
import { DecisionExecutionReceipt } from './decision-execution-coordinator.service';

export type ExecutionHistoryQuery = { userId?: string; status?: DecisionExecutionReceipt['status']; action?: string; limit?: number };

@Injectable()
export class DecisionExecutionHistoryService {
  private readonly entries: DecisionExecutionReceipt[] = [];
  private readonly maxEntries = 500;

  record(receipt: DecisionExecutionReceipt): DecisionExecutionReceipt {
    this.entries.push(receipt);
    if (this.entries.length > this.maxEntries) this.entries.splice(0, this.entries.length - this.maxEntries);
    return receipt;
  }

  recent(query: ExecutionHistoryQuery = {}): DecisionExecutionReceipt[] {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    return this.entries
      .filter((entry) => (!query.userId || entry.userId === query.userId) && (!query.status || entry.status === query.status) && (!query.action || entry.action === query.action))
      .slice(-limit)
      .reverse();
  }

  stats(userId?: string) {
    const entries = this.entries.filter((entry) => !userId || entry.userId === userId);
    return entries.reduce((result, entry) => {
      result.total += 1;
      result.byStatus[entry.status] = (result.byStatus[entry.status] ?? 0) + 1;
      result.totalDurationMs += entry.durationMs;
      result.totalAttempts += entry.attempts;
      return result;
    }, { total: 0, totalDurationMs: 0, totalAttempts: 0, byStatus: {} as Record<string, number> });
  }

  clear(): void { this.entries.length = 0; }
}
