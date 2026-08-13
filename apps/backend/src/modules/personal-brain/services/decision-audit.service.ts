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

@Injectable()
export class DecisionAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: Omit<DecisionAudit, 'id' | 'createdAt'>): Promise<DecisionAudit> {
    const entry = await this.prisma.decisionAuditEntry.create({
      data: {
        userId: input.userId,
        decisionId: input.decisionId,
        selectedIds: input.selectedIds,
        rejectedIds: input.rejectedIds,
        blockedIds: input.blockedIds,
        reason: input.reason,
      },
    });
    return this.map(entry);
  }

  async recent(userId: string, limit = 20): Promise<DecisionAudit[]> {
    const entries = await this.prisma.decisionAuditEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 50),
    });
    return entries.map((entry) => this.map(entry));
  }

  async byDecision(userId: string, decisionId: string): Promise<DecisionAudit[]> {
    const entries = await this.prisma.decisionAuditEntry.findMany({
      where: { userId, decisionId },
      orderBy: { createdAt: 'desc' },
    });
    return entries.map((entry) => this.map(entry));
  }

  async clear(userId: string): Promise<void> {
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
      selectedIds: Array.isArray(record.selectedIds) ? record.selectedIds.map(String) : [],
      rejectedIds: Array.isArray(record.rejectedIds) ? record.rejectedIds.map(String) : [],
      blockedIds: Array.isArray(record.blockedIds) ? record.blockedIds.map(String) : [],
      reason: record.reason,
      createdAt: record.createdAt,
    };
  }
}
