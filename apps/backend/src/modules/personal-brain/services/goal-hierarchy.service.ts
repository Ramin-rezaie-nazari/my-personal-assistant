import { Injectable } from '@nestjs/common';

export type GoalLike = {
  id: string;
  title: string;
  category: string;
  priority: number;
  progressPercent: number;
  targetDate: string | null;
  daysRemaining: number | null;
};

export type GoalHierarchyItem = GoalLike & {
  urgency: number;
  weight: number;
  horizon: 'urgent' | 'near_term' | 'long_term' | 'open';
  reason: string;
};

@Injectable()
export class GoalHierarchyService {
  rank(goals: GoalLike[], now = new Date()): GoalHierarchyItem[] {
    return goals
      .map((goal) => {
        const urgency = this.urgency(goal.daysRemaining);
        const priority = this.clamp(goal.priority / 10);
        const progressPressure = this.clamp((100 - goal.progressPercent) / 100);
        const weight = Number((priority * 0.45 + urgency * 0.35 + progressPressure * 0.20).toFixed(3));
        const horizon = this.horizon(goal.daysRemaining);
        const reason = goal.daysRemaining === null
          ? 'no target date; weighted by goal priority and progress'
          : goal.daysRemaining <= 7
            ? 'target is within seven days'
            : goal.daysRemaining <= 30
              ? 'target is within thirty days'
              : 'target is longer-term';
        return { ...goal, urgency, weight, horizon, reason };
      })
      .sort((a, b) => b.weight - a.weight);
  }

  impact(goal: GoalHierarchyItem, alignment = 0, downside = 0) {
    const normalizedAlignment = this.clamp(alignment);
    const normalizedDownside = this.clamp(downside);
    return Number((goal.weight * normalizedAlignment - normalizedDownside * 0.5).toFixed(3));
  }

  private urgency(daysRemaining: number | null) {
    if (daysRemaining === null) return 0.25;
    if (daysRemaining < 0) return 1;
    if (daysRemaining <= 3) return 1;
    if (daysRemaining <= 7) return 0.9;
    if (daysRemaining <= 30) return 0.7;
    if (daysRemaining <= 90) return 0.45;
    return 0.25;
  }

  private horizon(daysRemaining: number | null): GoalHierarchyItem['horizon'] {
    if (daysRemaining === null) return 'open';
    if (daysRemaining <= 7) return 'urgent';
    if (daysRemaining <= 30) return 'near_term';
    return 'long_term';
  }

  private clamp(value: number) {
    return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  }
}
