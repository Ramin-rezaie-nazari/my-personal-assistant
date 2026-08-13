import { Injectable } from '@nestjs/common';
import { BrainReasoningContext, BrainDecisionResult } from '../types';

export type FitnessDisciplineCandidate = {
  discipline: 'yoga' | 'calisthenics' | 'gym';
  score: number;
  reasons: string[];
};

@Injectable()
export class FitnessDecisionPolicyService {
  evaluate(context: BrainReasoningContext): BrainDecisionResult | null {
    const fitness = context.state.lifeContext?.fitness;
    if (!fitness) return null;

    const input = context.input.trim().toLowerCase();
    const exerciseRequest = /\b(workout|exercise|training|gym|fitness|yoga|calisthenics|train|work out)\b|تمرین|ورزش|بدنسازی|یوگا|کالیستنیکس/.test(input);
    if (!exerciseRequest) return null;

    const candidates: FitnessDisciplineCandidate[] = [
      { discipline: 'yoga', score: 0.35, reasons: ['mobility-and-recovery-friendly'] },
      { discipline: 'calisthenics', score: 0.35, reasons: ['bodyweight-friendly'] },
      { discipline: 'gym', score: 0.30, reasons: ['equipment-flexible'] },
    ];

    const goal = fitness.primaryGoal;
    const equipment = new Set(fitness.equipment);
    if (goal) {
      if (goal.kind === 'body_sculpt') {
        candidates.find(c => c.discipline === 'calisthenics')!.score += 0.15;
        candidates.find(c => c.discipline === 'yoga')!.score += 0.08;
      }
      if (goal.kind === 'strength') {
        candidates.find(c => c.discipline === 'gym')!.score += 0.18;
        candidates.find(c => c.discipline === 'calisthenics')!.score += 0.12;
      }
      if (goal.kind === 'fat_loss') {
        candidates.find(c => c.discipline === 'calisthenics')!.score += 0.10;
        candidates.find(c => c.discipline === 'gym')!.score += 0.08;
      }
      if (goal.avoidBulk) {
        candidates.find(c => c.discipline === 'yoga')!.score += 0.05;
        candidates.find(c => c.discipline === 'calisthenics')!.score += 0.04;
      }
    }

    if (equipment.has('none') && equipment.size === 1) {
      candidates.find(c => c.discipline === 'calisthenics')!.score += 0.20;
      candidates.find(c => c.discipline === 'gym')!.score -= 0.12;
    }
    if (equipment.has('dumbbells') || equipment.has('barbell') || equipment.has('cable_machine')) {
      candidates.find(c => c.discipline === 'gym')!.score += 0.20;
    }
    if (fitness.constraints.some(c => c.key === 'low_impact' && c.enabled)) {
      candidates.find(c => c.discipline === 'yoga')!.score += 0.15;
      candidates.find(c => c.discipline === 'calisthenics')!.score -= 0.04;
    }

    const memory = context.state.lifeContext?.decisionMemory;
    if (memory?.decisions >= 5 && memory.changeSignal === 'stable' && memory.selectedFrequency.length) {
      const prior = memory.selectedFrequency[0];
      const priorCandidate = candidates.find(c => c.discipline === prior.id);
      if (priorCandidate && prior.count >= 3) {
        priorCandidate.score += 0.04;
        priorCandidate.reasons.push(`prior-choice-pattern:${prior.count}`);
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];
    const reasons = [
      ...best.reasons,
      goal ? `primary-goal:${goal.kind}` : 'no-primary-goal',
      `target:${fitness.targetAreas.join(',')}`,
      `equipment:${[...equipment].join(',')}`,
    ];
    if (memory?.decisions >= 5) reasons.push(`decision-history:${memory.changeSignal}`);

    return {
      canDecide: context.reasoning.uncertainties.length === 0,
      confidence: Math.min(0.98, Math.max(0.35, best.score)),
      blockers: [...context.reasoning.uncertainties],
      intent: 'fitness-recommendation',
      recommendation: `Best training branch today: ${best.discipline}. ${reasons.join(' | ')}`,
      nextAction: `Generate a ${best.discipline} session using the user's fitness context`,
      candidates: candidates.map(c => ({ id: c.discipline, score: Number(c.score.toFixed(2)), rationale: c.reasons })),
    } as BrainDecisionResult & { candidates: unknown[] };
  }
}
