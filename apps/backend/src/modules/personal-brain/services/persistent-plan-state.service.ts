import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

export type PersistedPlanState = {
  planId: string;
  userId: string;
  status:
    | 'pending'
    | 'running'
    | 'completed'
    | 'partial'
    | 'blocked'
    | 'failed'
    | 'cancelled';
  stepIds: string[];
  completed: string[];
  blocked: string[];
  failed: string[];
  currentStep: string | null;
  updatedAt: Date;
};

@Injectable()
export class PersistentPlanStateService {
  constructor(private readonly prisma: PrismaService) {}

  async save(state: PersistedPlanState): Promise<PersistedPlanState> {
    const record = await this.prisma.planExecutionState.upsert({
      where: { userId_planId: { userId: state.userId, planId: state.planId } },
      create: {
        userId: state.userId,
        planId: state.planId,
        status: state.status,
        stepIds: state.stepIds,
        completed: state.completed,
        blocked: state.blocked,
        failed: state.failed,
        currentStep: state.currentStep,
      },
      update: {
        status: state.status,
        stepIds: state.stepIds,
        completed: state.completed,
        blocked: state.blocked,
        failed: state.failed,
        currentStep: state.currentStep,
      },
    });
    return this.map(record);
  }

  async get(
    userId: string,
    planId: string,
  ): Promise<PersistedPlanState | null> {
    const record = await this.prisma.planExecutionState.findUnique({
      where: { userId_planId: { userId, planId } },
    });
    return record ? this.map(record) : null;
  }

  async listRecent(userId: string, limit = 5): Promise<PersistedPlanState[]> {
    const records = await this.prisma.planExecutionState.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 20),
    });
    return records.map((record) => this.map(record));
  }

  async resume(
    userId: string,
    planId: string,
  ): Promise<PersistedPlanState | null> {
    const current = await this.get(userId, planId);
    if (!current) return null;
    if (current.status === 'running')
      return this.save({ ...current, status: 'partial' });
    return current;
  }

  async clear(userId: string, planId: string): Promise<void> {
    await this.prisma.planExecutionState.deleteMany({
      where: { userId, planId },
    });
  }

  private map(record: {
    userId: string;
    planId: string;
    status: string;
    stepIds: unknown;
    completed: unknown;
    blocked: unknown;
    failed: unknown;
    currentStep: string | null;
    updatedAt: Date;
  }): PersistedPlanState {
    return {
      userId: record.userId,
      planId: record.planId,
      status: record.status as PersistedPlanState['status'],
      stepIds: Array.isArray(record.stepIds) ? record.stepIds.map(String) : [],
      completed: Array.isArray(record.completed)
        ? record.completed.map(String)
        : [],
      blocked: Array.isArray(record.blocked) ? record.blocked.map(String) : [],
      failed: Array.isArray(record.failed) ? record.failed.map(String) : [],
      currentStep: record.currentStep,
      updatedAt: record.updatedAt,
    };
  }
}
