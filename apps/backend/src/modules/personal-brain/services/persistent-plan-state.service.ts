import { Injectable } from '@nestjs/common';

export type PersistedPlanState = {
  planId: string;
  userId: string;
  status: 'pending' | 'running' | 'completed' | 'partial' | 'blocked' | 'failed' | 'cancelled';
  stepIds: string[];
  completed: string[];
  blocked: string[];
  failed: string[];
  currentStep: string | null;
  updatedAt: Date;
};

@Injectable()
export class PersistentPlanStateService {
  private readonly records = new Map<string, PersistedPlanState>();

  save(state: PersistedPlanState): PersistedPlanState {
    const next = { ...state, updatedAt: new Date() };
    this.records.set(this.key(state.userId, state.planId), next);
    return next;
  }

  get(userId: string, planId: string): PersistedPlanState | null {
    return this.records.get(this.key(userId, planId)) ?? null;
  }

  resume(userId: string, planId: string): PersistedPlanState | null {
    const current = this.get(userId, planId);
    if (!current) return null;
    if (current.status === 'running') {
      return this.save({ ...current, status: 'partial' });
    }
    return current;
  }

  clear(userId: string, planId: string): void {
    this.records.delete(this.key(userId, planId));
  }

  private key(userId: string, planId: string): string {
    return `${userId}:${planId}`;
  }
}
