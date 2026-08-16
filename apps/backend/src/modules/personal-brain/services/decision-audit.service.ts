import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

export type DecisionAudit = {
  id: string;
  userId: string;
  decisionId: string;
  selectedIds: string[];
  rejectedIds: string[];
  blockedIds: string[];
  reason: string;
  createdAt: Date;
};

type AuditInput = Omit<DecisionAudit, 'id' | 'createdAt' | 'userId'> & { userId?: string };

@Injectable()
export class DecisionAuditService {
  private readonly memory: DecisionAudit[] = [];
  private sequence = 0;

  constructor(private readonly prisma?: PrismaService) {}

  record(input: AuditInput): Promise<DecisionAudit> {
    const userId = input.userId ?? '';
    if (!this.prisma) {
      const entry: DecisionAudit = {
        id: `audit-${++this.sequence}`,
        userId,
        decisionId: input.decisionId,
        selectedIds: [...input.selectedIds],
        rejectedIds: [...input.rejectedIds],
        blockedIds: [...input.blockedIds],
        reason: input.reason,
        createdAt: new Date(),
      };
      this.memory.unshift(entry);
      return Promise.resolve(entry);
    }

    return this.prisma.decisionAuditEntry
      .create({
        data: {
          userId,
          decisionId: input.decisionId,
          selectedIds: input.selectedIds,
          rejectedIds: input.rejectedIds,
          blockedIds: input.blockedIds,
          reason: input.reason,
        },
      })
      .then((entry) => this.map(entry));
  }

  async recent(userId = '', limit = 20): Promise<DecisionAudit[]> {
    if (!this.prisma)
      return this.memory
        .filter((entry) => !userId || entry.userId === userId)
        .slice(0, Math.min(Math.max(limit, 1), 50));
    const entries = await this.prisma.decisionAuditEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 50),
    });
    return entries.map((entry) => this.map(entry));
  }

  async byDecision(
    userId: string,
    decisionId: string,
  ): Promise<DecisionAudit[]> {
    if (!this.prisma)
      return this.memory.filter(
        (entry) => entry.userId === userId && entry.decisionId === decisionId,
      );
    const entries = await this.prisma.decisionAuditEntry.findMany({
      where: { userId, decisionId },
      orderBy: { createdAt: 'desc' },
    });
    return entries.map((entry) => this.map(entry));
  }

  async clear(userId: string): Promise<void> {
    if (!this.prisma) {
      for (let index = this.memory.length - 1; index >= 0; index -= 1) {
        if (this.memory[index].userId === userId) this.memory.splice(index, 1);
      }
      return;
    }
    await this.prisma.decisionAuditEntry.deleteMany({ where: { userId } });
  }

  private map(record: {
    id: string;
    userId: string;
    decisionId: string;
    selectedIds: unknown;
    rejectedIds: unknown;
    blockedIds: unknown;
    reason: string;
    createdAt: Date;
  }): DecisionAudit {
    return {
      id: record.id,
      userId: record.userId,
      decisionId: record.decisionId,
      selectedIds: Array.isArray(record.selectedIds)
        ? record.selectedIds.map(String)
        : [],
      rejectedIds: Array.isArray(record.rejectedIds)
        ? record.rejectedIds.map(String)
        : [],
      blockedIds: Array.isArray(record.blockedIds)
        ? record.blockedIds.map(String)
        : [],
      reason: record.reason,
      createdAt: record.createdAt,
    };
  }
}
