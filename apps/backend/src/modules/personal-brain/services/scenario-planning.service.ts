import { Injectable } from '@nestjs/common';
import { DecisionCandidate } from './unified-decision-engine.service';

export type ScenarioState = { goalAlignment: number; goalDownside: number; budgetImpact: number; capacityImpact: number; healthImpact: number; confidence: number };
export type Scenario = { id: string; title: string; action?: string; state: ScenarioState; score: number; recommendation: 'best' | 'acceptable' | 'weak' | 'unsafe'; rationale: string[] };
export type ScenarioPlanningInput = { candidates: DecisionCandidate[]; baseline?: Partial<ScenarioState>; context?: { budgetPressure?: boolean; capacityPressure?: boolean; healthConstraint?: boolean } };

@Injectable()
export class ScenarioPlanningService {
  compare(input: ScenarioPlanningInput): { scenarios: Scenario[]; best: Scenario | null } {
    const baseline: ScenarioState = { goalAlignment: this.clamp(input.baseline?.goalAlignment ?? 0.5), goalDownside: this.clamp(input.baseline?.goalDownside ?? 0), budgetImpact: this.clamp(input.baseline?.budgetImpact ?? 0), capacityImpact: this.clamp(input.baseline?.capacityImpact ?? 0), healthImpact: this.clamp(input.baseline?.healthImpact ?? 0), confidence: this.clamp(input.baseline?.confidence ?? 0.5) };
    const scenarios = input.candidates.map((candidate) => {
      const state: ScenarioState = {
        goalAlignment: this.clamp(candidate.goalAlignment ?? baseline.goalAlignment),
        goalDownside: this.clamp(candidate.goalDownside ?? baseline.goalDownside),
        budgetImpact: input.context?.budgetPressure && candidate.domain === 'shopping' ? 0.8 : baseline.budgetImpact,
        capacityImpact: input.context?.capacityPressure && (candidate.domain === 'workout' || candidate.domain === 'schedule') ? 0.75 : baseline.capacityImpact,
        healthImpact: input.context?.healthConstraint && (candidate.domain === 'workout' || candidate.domain === 'nutrition') ? 0.95 : baseline.healthImpact,
        confidence: this.clamp(candidate.confidence),
      };
      const score = this.score(state);
      const rationale: string[] = [];
      if (state.goalAlignment >= 0.75) rationale.push('strong alignment with long-term goals');
      if (state.goalDownside >= 0.7) rationale.push('meaningful long-term downside');
      if (state.budgetImpact >= 0.7) rationale.push('high budget pressure');
      if (state.capacityImpact >= 0.7) rationale.push('high capacity cost');
      if (state.healthImpact >= 0.7) rationale.push('high health risk/constraint impact');
      if (state.confidence < 0.5) rationale.push('limited confidence in the scenario');
      if (!rationale.length) rationale.push('balanced trade-off');
      return { id: `scenario:${candidate.id}`, title: candidate.action, action: candidate.action, state, score, recommendation: this.recommendation(state, score), rationale };
    });
    scenarios.sort((a, b) => b.score - a.score);
    return { scenarios, best: scenarios[0] ?? null };
  }

  private score(state: ScenarioState): number { return Number(Math.max(0, Math.min(1, state.goalAlignment * 0.30 + state.confidence * 0.20 - state.goalDownside * 0.18 - state.budgetImpact * 0.10 - state.capacityImpact * 0.10 - state.healthImpact * 0.12)).toFixed(3)); }
  private recommendation(state: ScenarioState, score: number): Scenario['recommendation'] { if (state.healthImpact >= 0.85) return 'unsafe'; if (score >= 0.7) return 'best'; if (score >= 0.5) return 'acceptable'; return 'weak'; }
  private clamp(value: number): number { return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)); }
}
