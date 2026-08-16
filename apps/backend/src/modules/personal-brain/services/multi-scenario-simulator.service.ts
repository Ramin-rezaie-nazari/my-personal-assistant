import { Injectable } from '@nestjs/common';

import { DecisionCandidate } from './unified-decision-engine.service';
import { Scenario, ScenarioPlanningService } from './scenario-planning.service';

export type ScenarioPlan = {
  id: string;
  title: string;
  candidateIds: string[];
  scenarios: Scenario[];
  totalScore: number;
  recommendation: 'best' | 'acceptable' | 'weak' | 'unsafe';
  rationale: string[];
};

@Injectable()
export class MultiScenarioSimulatorService {
  constructor(private readonly scenarioPlanner: ScenarioPlanningService) {}

  simulate(
    candidates: DecisionCandidate[],
    options: {
      maxPlans?: number;
      context?: {
        budgetPressure?: boolean;
        capacityPressure?: boolean;
        healthConstraint?: boolean;
      };
    } = {},
  ): { plans: ScenarioPlan[]; best: ScenarioPlan | null } {
    const maxPlans = Math.max(1, Math.min(5, options.maxPlans ?? 3));
    const plans: ScenarioPlan[] = [];

    const base = this.scenarioPlanner.compare({
      candidates,
      context: options.context,
    });
    if (base.best) {
      plans.push(
        this.toPlan(
          'plan-a',
          'Best single-path plan',
          base.scenarios,
          [base.best.id],
          base.best.score,
        ),
      );
    }

    const reversed = [...candidates].reverse();
    const conservative = this.scenarioPlanner.compare({
      candidates: reversed.map((candidate) => ({
        ...candidate,
        score: Math.min(candidate.score, 0.65),
        goalDownside: Math.min(1, (candidate.goalDownside ?? 0) + 0.1),
      })),
      context: options.context,
    });
    if (conservative.best) {
      plans.push(
        this.toPlan(
          'plan-b',
          'Conservative plan',
          conservative.scenarios,
          [conservative.best.id],
          conservative.best.score,
        ),
      );
    }

    if (candidates.length > 1) {
      const balanced = this.scenarioPlanner.compare({
        candidates: candidates.map((candidate) => ({
          ...candidate,
          confidence: Math.max(candidate.confidence, 0.65),
          goalAlignment: Math.min(1, (candidate.goalAlignment ?? 0.5) + 0.05),
        })),
        context: options.context,
      });
      if (balanced.best) {
        plans.push(
          this.toPlan(
            'plan-c',
            'Balanced plan',
            balanced.scenarios,
            balanced.scenarios.slice(0, 2).map((s) => s.id),
            balanced.best.score,
          ),
        );
      }
    }

    const unique = new Map(plans.map((plan) => [plan.id, plan]));
    const ranked = [...unique.values()]
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, maxPlans);
    return { plans: ranked, best: ranked[0] ?? null };
  }

  private toPlan(
    id: string,
    title: string,
    scenarios: Scenario[],
    candidateIds: string[],
    totalScore: number,
  ): ScenarioPlan {
    const selected = scenarios.filter((scenario) =>
      candidateIds.includes(scenario.id),
    );
    const unsafe = selected.some(
      (scenario) => scenario.recommendation === 'unsafe',
    );
    const recommendation: ScenarioPlan['recommendation'] = unsafe
      ? 'unsafe'
      : totalScore >= 0.7
        ? 'best'
        : totalScore >= 0.5
          ? 'acceptable'
          : 'weak';
    const rationale = selected
      .flatMap((scenario) => scenario.rationale)
      .slice(0, 5);
    return {
      id,
      title,
      candidateIds,
      scenarios: selected,
      totalScore,
      recommendation,
      rationale,
    };
  }
}
