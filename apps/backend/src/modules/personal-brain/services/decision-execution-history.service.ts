import { Injectable } from '@nestjs/common';
import type { DecisionExecutionReceipt } from './decision-execution-coordinator.service';
import { DecisionHistoryRetentionService } from './decision-history-retention.service';
export type ExecutionHistoryQuery = {
  userId?: string;
  status?: DecisionExecutionReceipt['status'];
  action?: string;
  limit?: number;
};
@Injectable()
export class DecisionExecutionHistoryService {
  private readonly entries: DecisionExecutionReceipt[] = [];
  constructor(
    private readonly retention: DecisionHistoryRetentionService = new DecisionHistoryRetentionService(),
  ) {}
  record(r: DecisionExecutionReceipt) {
    this.entries.push(r);
    this.purgeExpired(r.recordedAt);
    return r;
  }
  recent(q: ExecutionHistoryQuery = {}, now = Date.now()) {
    this.purgeExpired(now);
    const l = Math.min(Math.max(q.limit ?? 20, 1), 100);
    return this.entries
      .filter(
        (e) =>
          (!q.userId || e.userId === q.userId) &&
          (!q.status || e.status === q.status) &&
          (!q.action || e.action === q.action),
      )
      .slice(-l)
      .reverse();
  }
  stats(userId?: string, now = Date.now()) {
    this.purgeExpired(now);
    return this.entries
      .filter((e) => !userId || e.userId === userId)
      .reduce(
        (r, e) => {
          r.total++;
          r.byStatus[e.status] = (r.byStatus[e.status] ?? 0) + 1;
          r.totalDurationMs += e.durationMs;
          r.totalAttempts += e.attempts;
          return r;
        },
        {
          total: 0,
          totalDurationMs: 0,
          totalAttempts: 0,
          byStatus: {},
        },
      );
  }
  deleteRecentActivity(userId: string, hours: number, now = Date.now()) {
    const cutoff = now - Math.min(Math.max(hours, 0.25), 24 * 365) * 3600000,
      b = this.entries.length;
    for (let i = this.entries.length - 1; i >= 0; i--)
      if (
        this.entries[i].userId === userId &&
        this.entries[i].recordedAt >= cutoff
      )
        this.entries.splice(i, 1);
    return b - this.entries.length;
  }
  clearUser(userId: string) {
    const b = this.entries.length;
    for (let i = this.entries.length - 1; i >= 0; i--)
      if (this.entries[i].userId === userId) this.entries.splice(i, 1);
    return b - this.entries.length;
  }
  clear() {
    this.entries.length = 0;
  }
  private purgeExpired(now: number) {
    for (let i = this.entries.length - 1; i >= 0; i--)
      if (
        this.retention.isExpired(
          this.entries[i].userId,
          this.entries[i].recordedAt,
          now,
        )
      )
        this.entries.splice(i, 1);
  }
}
