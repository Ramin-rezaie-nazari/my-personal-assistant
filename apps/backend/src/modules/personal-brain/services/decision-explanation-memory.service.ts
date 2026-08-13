import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

export type DecisionExplanationMemoryItem = {
  id: string;
  decisionId: string;
  reason: string;
  selectedIds: string[];
  rejectedIds: string[];
  blockedIds: string[];
  createdAt: string;
};

export type DecisionExplanationTrend = {
  windowDays: number;
  decisions: number;
  recent: DecisionExplanationMemoryItem[];
  repeatedReasons: Array<{ reason: string; count: number }>;
  selectedFrequency: Array<{ id: string; count: number }>;
  changeSignal: 'stable' | 'changing' | 'insufficient-data';
};

@Injectable()
export class DecisionExplanationMemoryService {
  constructor(private readonly prisma: PrismaService) {}

  async recent(userId: string, limit = 30): Promise<DecisionExplanationMemoryItem[]> {
    const rows = await this.prisma.decisionAuditEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
    });

    return rows.map((row) => this.map(row));
  }

  async trend(userId: string, windowDays = 90): Promise<DecisionExplanationTrend> {
    const safeDays = Math.min(365, Math.max(7, Math.round(windowDays)));
    const since = new Date(Date.now() - safeDays * 86_400_000);
    const rows = await this.prisma.decisionAuditEntry.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const reasons = new Map<string, number>();
    const selected = new Map<string, number>();
    for (const row of rows) {
      reasons.set(row.reason, (reasons.get(row.reason) ?? 0) + 1);
      const ids = Array.isArray(row.selectedIds) ? row.selectedIds.map(String) : [];
      for (const id of ids) selected.set(id, (selected.get(id) ?? 0) + 1);
    }

    const repeatedReasons = [...reasons.entries()]
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([reason, count]) => ({ reason, count }));

    const selectedFrequency = [...selected.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([id, count]) => ({ id, count }));

    const changeSignal = rows.length < 3
      ? 'insufficient-data'
      : this.detectChange(rows.map((row) => row.reason));

    return {
      windowDays: safeDays,
      decisions: rows.length,
      recent: rows.slice(0, 12).map((row) => this.map(row)),
      repeatedReasons,
      selectedFrequency,
      changeSignal,
    };
  }

  private detectChange(reasons: string[]): DecisionExplanationTrend['changeSignal'] {
    if (reasons.length < 4) return 'insufficient-data';
    const recent = reasons.slice(0, Math.ceil(reasons.length / 3));
    const older = reasons.slice(-Math.ceil(reasons.length / 3));
    const recentSet = new Set(recent);
    const olderSet = new Set(older);
    let delta = 0;
    for (const reason of recentSet) if (!olderSet.has(reason)) delta++;
    for (const reason of olderSet) if (!recentSet.has(reason)) delta++;
    return delta >= 2 ? 'changing' : 'stable';
  }

  private map(row: {
    id: string;
    decisionId: string;
    reason: string;
    selectedIds: unknown;
    rejectedIds: unknown;
    blockedIds: unknown;
    createdAt: Date;
  }): DecisionExplanationMemoryItem {
    return {
      id: row.id,
      decisionId: row.decisionId,
      reason: row.reason,
      selectedIds: Array.isArray(row.selectedIds) ? row.selectedIds.map(String) : [],
      rejectedIds: Array.isArray(row.rejectedIds) ? row.rejectedIds.map(String) : [],
      blockedIds: Array.isArray(row.blockedIds) ? row.blockedIds.map(String) : [],
      createdAt: row.createdAt.toISOString(),
    };
  }
}
