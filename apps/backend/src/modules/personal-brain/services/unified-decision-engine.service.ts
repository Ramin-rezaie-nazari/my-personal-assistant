import { Injectable } from '@nestjs/common';

import { DecisionConflictResolutionService } from './decision-conflict-resolution.service';

export type DecisionDomain = 'schedule' | 'workout' | 'nutrition' | 'habit' | 'reminder' | 'notification' | 'conversation';

export type DecisionCandidate = {
  id: string;
  domain: DecisionDomain;
  action: string;
  score: number;
  confidence: number;
  priority?: number;
  source?: string;
  hardConstraint?: boolean;
  blockedBy?: string[];
  expiresAt?: Date;
  startAt?: Date;
  endAt?: Date;
  durationMinutes?: number;
};

export type UnifiedDecisionContext = {
  now?: Date;
  maxActions?: number;
  excludedDomains?: DecisionDomain[];
  urgency?: number;
  budgetPressure?: boolean;
  capacityPressure?: boolean;
  healthConstraint?: boolean;
  goalConflict?: boolean;
};

export type UnifiedDecision = {
  selected: DecisionCandidate[];
  rejected: DecisionCandidate[];
  blocked: DecisionCandidate[];
  reason: string;
  conflicts?: ReturnType<DecisionConflictResolutionService['resolve']>['conflicts'];
  rationale?: string[];
};

@Injectable()
export class UnifiedDecisionEngineService {
  constructor(private readonly conflicts: DecisionConflictResolutionService) {}

  decide(candidates: DecisionCandidate[], context: UnifiedDecisionContext = {}): UnifiedDecision {
    const now = context.now ?? new Date();
    const excluded = new Set(context.excludedDomains ?? []);
    const eligible = candidates.filter((candidate) => {
      if (excluded.has(candidate.domain)) return false;
      if (candidate.expiresAt && candidate.expiresAt.getTime() <= now.getTime()) return false;
      return !candidate.blockedBy?.length;
    });

    const blocked = candidates.filter((candidate) => candidate.blockedBy?.length);
    const hard = eligible.filter((candidate) => candidate.hardConstraint);
    const pool = hard.length ? hard : eligible;
    const resolved = this.conflicts.resolve(pool, context);
    const ranked = [...resolved.candidates].sort((a, b) => this.weight(b) - this.weight(a));
    const selected = ranked.slice(0, Math.max(1, context.maxActions ?? 1));
    const selectedIds = new Set(selected.map((candidate) => candidate.id));
    const rejected = candidates.filter((candidate) => !selectedIds.has(candidate.id) && !blocked.some((item) => item.id === candidate.id));

    return {
      selected,
      rejected,
      blocked,
      reason: resolved.conflicts.length
        ? 'conflicts_resolved_before_ranking'
        : hard.length
          ? 'hard_constraints_take_precedence'
          : 'ranked_by_priority_confidence_and_score',
      conflicts: resolved.conflicts,
      rationale: resolved.rationale,
    };
  }

  private weight(candidate: DecisionCandidate): number {
    const priority = Math.max(0, Math.min(1, candidate.priority ?? 0.5));
    const confidence = Math.max(0, Math.min(1, candidate.confidence));
    const score = Math.max(0, Math.min(1, candidate.score));
    return priority * 0.40 + confidence * 0.30 + score * 0.30;
  }
}
