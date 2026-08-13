import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
export type DecisionAudit = { id: string; userId: string; decisionId: string; selectedIds: string[]; rejectedIds: string[]; blockedIds: string[]; reason: string; createdAt: Date };
@Injectable()
export class DecisionAuditService {
  private readonly fallback: DecisionAudit[] = [];
  private sequence = 0;
  constructor(@Optional() private readonly prisma?: PrismaService) {}
  record(input: Omit<DecisionAudit,'id'|'createdAt'>): DecisionAudit | Promise<DecisionAudit> {
    if (this.prisma?.decisionAuditEntry) return this.prisma.decisionAuditEntry.create({ data: { userId: input.userId, decisionId: input.decisionId, selectedIds: input.selectedIds, rejectedIds: input.rejectedIds, blockedIds: input.blockedIds, reason: input.reason } }).then((entry) => this.map(entry));
    const entry: DecisionAudit = { ...input, id: `audit-${++this.sequence}`, createdAt: new Date() }; this.fallback.unshift(entry); return entry;
  }
  recent(userId: string, limit = 20): DecisionAudit[] | Promise<DecisionAudit[]> {
    const take = Math.min(Math.max(limit,1),50);
    if (this.prisma?.decisionAuditEntry) return this.prisma.decisionAuditEntry.findMany({ where: { userId }, orderBy: { createdAt:'desc' }, take }).then((entries)=>entries.map((entry)=>this.map(entry)));
    return this.fallback.filter((entry)=>entry.userId===userId).slice(0,take);
  }
  byDecision(userId: string, decisionId: string): DecisionAudit[] | Promise<DecisionAudit[]> {
    if (this.prisma?.decisionAuditEntry) return this.prisma.decisionAuditEntry.findMany({ where:{ userId, decisionId }, orderBy:{ createdAt:'desc' } }).then((entries)=>entries.map((entry)=>this.map(entry)));
    return this.fallback.filter((entry)=>entry.userId===userId&&entry.decisionId===decisionId);
  }
  clear(userId: string): void | Promise<void> {
    if (this.prisma?.decisionAuditEntry) return this.prisma.decisionAuditEntry.deleteMany({ where:{ userId } }).then(()=>undefined);
    for (let i=this.fallback.length-1;i>=0;i-=1) if(this.fallback[i].userId===userId) this.fallback.splice(i,1);
  }
  private map(record:{id:string;userId:string;decisionId:string;selectedIds:unknown;rejectedIds:unknown;blockedIds:unknown;reason:string;createdAt:Date}): DecisionAudit { return { id:record.id,userId:record.userId,decisionId:record.decisionId,selectedIds:Array.isArray(record.selectedIds)?record.selectedIds.map(String):[],rejectedIds:Array.isArray(record.rejectedIds)?record.rejectedIds.map(String):[],blockedIds:Array.isArray(record.blockedIds)?record.blockedIds.map(String):[],reason:record.reason,createdAt:record.createdAt }; }
}
