import { Injectable } from '@nestjs/common';

export type DecisionAudit = {
  decisionId: string;
  selectedIds: string[];
  rejectedIds: string[];
  blockedIds: string[];
  reason: string;
  createdAt: Date;
};

@Injectable()
export class DecisionAuditService {
  private readonly entries: DecisionAudit[] = [];

  record(input: Omit<DecisionAudit, 'createdAt'>): DecisionAudit {
    const entry = { ...input, createdAt: new Date() };
    this.entries.push(entry);
    return entry;
  }

  recent(limit = 20): DecisionAudit[] {
    return this.entries.slice(-Math.max(1, limit)).reverse();
  }

  clear(): void {
    this.entries.length = 0;
  }
}
