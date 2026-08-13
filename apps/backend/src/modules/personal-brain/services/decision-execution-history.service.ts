import { Injectable, Optional } from '@nestjs/common';
import type { DecisionExecutionReceipt } from './decision-execution-coordinator.service';
import { DecisionHistoryRetentionService } from './decision-history-retention.service';

export type ExecutionHistoryQuery = { userId?: string; status?: DecisionExecutionReceipt['status']; action?: string; limit?: number };

@Injectable()
export class DecisionExecutionHistoryService {
  private readonly entries: DecisionExecutionReceipt[] = [];
  constructor(@Optional() private readonly retention?: DecisionHistoryRetentionService) {}
  record(receipt: DecisionExecutionReceipt): DecisionExecutionReceipt { this.entries.push(receipt); this.purgeExpired(receipt.recordedAt); return receipt; }
  recent(query: ExecutionHistoryQuery = {}, now = Date.now()): DecisionExecutionReceipt[] { this.purgeExpired(now); const limit = Math.min(Math.max(query.limit ?? 20, 1), 100); return this.entries.filter((entry) => (!query.userId || entry.userId === query.userId) && (!query.status || entry.status === query.status) && (!query.action || entry.action === query.action)).slice(-limit).reverse(); }
  stats(userId?: string, now = Date.now()) { this.purgeExpired(now); const entries = this.entries.filter((entry) => !userId || entry.userId === userId); return entries.reduce((result, entry) => { result.total += 1; result.byStatus[entry.status] = (result.byStatus[entry.status] ?? 0) + 1; result.totalDurationMs += entry.durationMs; result.totalAttempts += entry.attempts; return result; }, { total: 0, totalDurationMs: 0, totalAttempts: 0, byStatus: {} as Record<string, number> }); }
  deleteRecentActivity(userId: string, hours: number, now = Date.now()): number { const safeHours = Math.min(Math.max(hours, 0.25), 24 * 365); const cutoff = now - safeHours * 60 * 60 * 1000; const before = this.entries.length; for (let index = this.entries.length - 1; index >= 0; index -= 1) { const entry = this.entries[index]; if (entry.userId === userId && entry.recordedAt >= cutoff) this.entries.splice(index, 1); } return before - this.entries.length; }
  clearUser(userId: string): number { const before = this.entries.length; for (let index = this.entries.length - 1; index >= 0; index -= 1) if (this.entries[index].userId === userId) this.entries.splice(index, 1); return before - this.entries.length; }
  clear(): void { this.entries.length = 0; }
  private purgeExpired(now: number): void { if (!this.retention) return; for (let index = this.entries.length - 1; index >= 0; index -= 1) if (this.retention.isExpired(this.entries[index].userId, this.entries[index].recordedAt, now)) this.entries.splice(index, 1); }
}
