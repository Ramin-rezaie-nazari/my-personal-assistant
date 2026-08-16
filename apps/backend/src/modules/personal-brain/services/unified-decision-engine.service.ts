import { Injectable } from '@nestjs/common';

import { DecisionConflictResolutionService } from './decision-conflict-resolution.service';

export type DecisionDomain = 'schedule' | 'workout' | 'nutrition' | 'habit' | 'reminder' | 'notification' | 'conversation' | 'shopping';

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
  goalAlignment?: number;
  goalDownside?: number;
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
  longTermPlanning?: boolean;
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
  constructor(private readonly conflicts: DecisionConflictResolutionService = new DecisionConflictResolutionService()) {}

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
    const ranked = [...resolved.candidates].sort((a, b) => this.weight(b, context) - this.weight(a, context));
    const selected = ranked.slice(0, Math.max(1, context.maxActions ?? 1));
    const selectedIds = new Set(selected.map((candidate) => candidate.id));
    const rejected = candidates.filter((candidate) => !selectedIds.has(candidate.id) && !blocked.some((item) => item.id === candidate.id));
    const reason = resolved.conflicts.length ? 'conflicts_resolved_before_ranking' : hard.length ? 'hard_constraints_take_precedence' : context.longTermPlanning ? 'ranked_with_long_term_goal_impact' : 'ranked_by_priority_confidence_and_score';
    return { selected, rejected, blocked, reason, conflicts: resolved.conflicts, rationale: this.buildRationale(selected, rejected, blocked, resolved.rationale, reason) };
  }

  private buildRationale(selected: DecisionCandidate[], rejected: DecisionCandidate[], blocked: DecisionCandidate[], conflictRationale: string[] = [], decisionReason: string): string[] {
    const lines: string[] = [];
    for (const item of selected) {
      lines.push(`${item.action} was selected because its priority (${this.pct(item.priority ?? 0)}) confidence (${this.pct(item.confidence)}) and score (${this.pct(item.score)}) made it the strongest current option.`);
      if ((item.goalAlignment ?? 0) >= 0.8) lines.push(`${item.action} strongly matches the active goal.`);
      if (item.hardConstraint) lines.push(`${item.action} satisfied a required constraint.`);
    }
    for (const item of rejected.slice(0, 3)) lines.push(`${item.action} ranked below the selected option after the current checks.`);
    for (const item of blocked.slice(0, 3)) lines.push(`${item.action} was blocked by ${item.blockedBy?.join(', ') || 'a prerequisite or safety constraint'}.`);
    lines.push(...conflictRationale.slice(0, 3));
    lines.push(`Decision rule: ${decisionReason.replace(/[_-]+/g, ' ')}.`);
    return [...new Set(lines)];
  }

  private pct(value: number) { return `${Math.round(this.clamp(value) * 100)}%`; }
  private weight(candidate: DecisionCandidate, context: UnifiedDecisionContext): number {
    const priority = this.clamp(candidate.priority ?? 0.5);
    const confidence = this.clamp(candidate.confidence);
    const score = this.clamp(candidate.score);
    const goalAlignment = this.clamp(candidate.goalAlignment ?? 0.5);
    const goalDownside = this.clamp(candidate.goalDownside ?? 0);
    const base = priority * 0.35 + confidence * 0.25 + score * 0.25;
    return base + (context.longTermPlanning ? goalAlignment * 0.15 - goalDownside * 0.1 : 0);
  }
  private clamp(value: number) { return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)); }
}
