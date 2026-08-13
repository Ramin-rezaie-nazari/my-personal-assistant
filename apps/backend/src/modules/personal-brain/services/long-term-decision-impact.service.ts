import { Injectable } from '@nestjs/common';
import { GoalHierarchyService, GoalLike } from './goal-hierarchy.service';

export type GoalAwareCandidate = {
  id: string;
  action: string;
  domain: string;
  goalAlignment?: number;
  goalDownside?: number;
};

@Injectable()
export class LongTermDecisionImpactService {
  constructor(private readonly hierarchy: GoalHierarchyService) {}

  evaluate(goals: GoalLike[], candidate: GoalAwareCandidate) {
    const ranked = this.hierarchy.rank(goals);
    if (!ranked.length) {
      return { score: 0, alignment: 0, downside: 0, rationale: 'no active long-term goals available' };
    }

    const alignment = this.clamp(candidate.goalAlignment ?? this.inferAlignment(candidate, ranked));
    const downside = this.clamp(candidate.goalDownside ?? 0);
    const impacts = ranked.map((goal) => ({
      goalId: goal.id,
      title: goal.title,
      impact: this.hierarchy.impact(goal, alignment, downside),
    }));
    const score = Number((impacts.reduce((sum, item) => sum + item.impact, 0) / Math.max(1, impacts.length)).toFixed(3));
    const strongest = [...impacts].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))[0];

    return {
      score,
      alignment,
      downside,
      strongestGoal: strongest,
      rationale: score > 0
        ? `supports long-term goal: ${strongest.title}`
        : score < 0
          ? `creates long-term trade-off against: ${strongest.title}`
          : 'neutral long-term impact',
      impacts,
    };
  }

  private inferAlignment(candidate: GoalAwareCandidate, goals: Array<GoalLike & { category: string }>) {
    const text = `${candidate.action} ${candidate.domain}`.toLowerCase();
    const matching = goals.filter((goal) => {
      const tokens = `${goal.title} ${goal.category}`.toLowerCase().split(/\s+/).filter(Boolean);
      return tokens.some((token) => token.length >= 4 && text.includes(token));
    });
    return matching.length ? 0.75 : 0.35;
  }

  private clamp(value: number) {
    return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  }
}
