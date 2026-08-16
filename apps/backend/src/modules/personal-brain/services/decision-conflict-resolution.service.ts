import { Injectable } from '@nestjs/common';

import { DecisionCandidate } from './unified-decision-engine.service';

export type DecisionConflict = {
  candidateId: string;
  competingCandidateId: string;
  type: 'time' | 'goal' | 'budget' | 'capacity' | 'health' | 'preference';
  severity: number;
  reason: string;
  resolution: 'prefer_first' | 'prefer_second' | 'defer' | 'allow_both';
};

export type ConflictResolution = {
  candidates: DecisionCandidate[];
  conflicts: DecisionConflict[];
  rationale: string[];
};

@Injectable()
export class DecisionConflictResolutionService {
  resolve(
    candidates: DecisionCandidate[],
    context: Record<string, unknown> = {},
  ): ConflictResolution {
    const conflicts: DecisionConflict[] = [];
    const rationale: string[] = [];
    const ranked = [...candidates].sort(
      (a, b) => this.utility(b, context) - this.utility(a, context),
    );
    const kept: DecisionCandidate[] = [];

    for (const candidate of ranked) {
      let rejected = false;
      for (const existing of kept) {
        const conflict = this.detect(existing, candidate, context);
        if (!conflict) continue;
        conflicts.push(conflict);
        if (conflict.resolution === 'prefer_first') {
          rejected = true;
          rationale.push(
            `${candidate.id} deferred because ${existing.id} has higher effective utility.`,
          );
          break;
        }
        if (conflict.resolution === 'prefer_second') {
          const index = kept.findIndex((item) => item.id === existing.id);
          if (index >= 0) kept.splice(index, 1);
          rationale.push(
            `${existing.id} deferred because ${candidate.id} has higher effective utility.`,
          );
        }
      }
      if (!rejected) kept.push(candidate);
    }

    return {
      candidates: kept,
      conflicts,
      rationale,
    };
  }

  private utility(
    candidate: DecisionCandidate,
    context: Record<string, unknown>,
  ): number {
    const priority = this.clamp(candidate.priority ?? 0.5);
    const confidence = this.clamp(candidate.confidence);
    const score = this.clamp(candidate.score);
    const urgency = this.clamp(Number(context.urgency ?? 0));
    return priority * 0.4 + confidence * 0.25 + score * 0.25 + urgency * 0.1;
  }

  private detect(
    first: DecisionCandidate,
    second: DecisionCandidate,
    context: Record<string, unknown>,
  ): DecisionConflict | null {
    const firstDomain = first.domain;
    const secondDomain = second.domain;
    if (this.hasTimeConflict(first, second)) {
      return this.make(
        first,
        second,
        'time',
        0.8,
        'Both actions compete for the same time window.',
      );
    }
    if (
      context.budgetPressure === true &&
      (firstDomain === 'shopping' || secondDomain === 'shopping')
    ) {
      return this.make(
        first,
        second,
        'budget',
        0.75,
        'Shopping decisions compete under current budget pressure.',
      );
    }
    if (
      context.capacityPressure === true &&
      (firstDomain === 'workout' || secondDomain === 'schedule')
    ) {
      return this.make(
        first,
        second,
        'capacity',
        0.7,
        'Available daily capacity is constrained.',
      );
    }
    if (
      context.healthConstraint === true &&
      (firstDomain === 'workout' || secondDomain === 'nutrition')
    ) {
      return this.make(
        first,
        second,
        'health',
        0.85,
        'A health constraint makes these actions competing choices.',
      );
    }
    if (context.goalConflict === true) {
      return this.make(
        first,
        second,
        'goal',
        0.6,
        'The actions pull the user toward competing goals.',
      );
    }
    return null;
  }

  private hasTimeConflict(
    first: DecisionCandidate,
    second: DecisionCandidate,
  ): boolean {
    const firstWindow = this.window(first);
    const secondWindow = this.window(second);
    if (!firstWindow || !secondWindow) return false;
    return (
      firstWindow.start < secondWindow.end &&
      secondWindow.start < firstWindow.end
    );
  }

  private window(
    candidate: DecisionCandidate,
  ): { start: number; end: number } | null {
    const value = candidate as DecisionCandidate & {
      startAt?: Date;
      endAt?: Date;
      durationMinutes?: number;
    };
    if (!value.startAt) return null;
    const start = new Date(value.startAt).getTime();
    const end = value.endAt
      ? new Date(value.endAt).getTime()
      : start + Math.max(15, Number(value.durationMinutes ?? 30)) * 60_000;
    return { start, end };
  }

  private make(
    first: DecisionCandidate,
    second: DecisionCandidate,
    type: DecisionConflict['type'],
    severity: number,
    reason: string,
  ): DecisionConflict {
    return {
      candidateId: first.id,
      competingCandidateId: second.id,
      type,
      severity,
      reason,
      resolution:
        this.utility(first, {}) >= this.utility(second, {})
          ? 'prefer_first'
          : 'prefer_second',
    };
  }

  private clamp(value: number): number {
    return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  }
}
