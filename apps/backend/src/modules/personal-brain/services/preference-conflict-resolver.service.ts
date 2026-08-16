import { Injectable } from '@nestjs/common';

export type PreferenceCandidate = {
  key: string;
  value: string;
  score: number;
  confidence: number;
  priority?: number;
  source?: string;
  hardConstraint?: boolean;
};
export type ConflictResolution = {
  selected: PreferenceCandidate | null;
  rejected: PreferenceCandidate[];
  reason: string;
};

@Injectable()
export class PreferenceConflictResolverService {
  resolve(candidates: PreferenceCandidate[]): ConflictResolution {
    if (!candidates.length)
      return { selected: null, rejected: [], reason: 'no_candidates' };
    const hard = candidates.filter((c) => c.hardConstraint);
    const pool = hard.length ? hard : candidates;
    const ranked = [...pool].sort(
      (a, b) =>
        (b.priority ?? 0) * 0.45 +
        b.confidence * 0.3 +
        b.score * 0.25 -
        ((a.priority ?? 0) * 0.45 + a.confidence * 0.3 + a.score * 0.25),
    );
    const selected = ranked[0];
    return {
      selected,
      rejected: candidates.filter((c) => c !== selected),
      reason: hard.length
        ? 'hard_constraint_wins_then_ranked'
        : 'ranked_by_priority_confidence_and_score',
    };
  }
}
