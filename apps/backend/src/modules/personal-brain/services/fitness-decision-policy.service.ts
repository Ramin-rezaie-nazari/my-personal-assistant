import { Injectable } from '@nestjs/common';
import type { BrainReasoningContext, BrainDecisionResult } from '../types';
export type FitnessDisciplineCandidate = { discipline: 'yoga' | 'calisthenics' | 'gym'; score: number; reasons: string[] };
@Injectable()
export class FitnessDecisionPolicyService {
  evaluate(context: BrainReasoningContext): BrainDecisionResult | null {
    const fitness = context.state.lifeContext?.fitness; if (!fitness) return null;
    const input = context.input.trim().toLowerCase(); if (!(/\b(workout|exercise|training|gym|fitness|yoga|calisthenics|train|work out)\b|تمرین|ورزش|بدنسازی|یوگا|کالیستنیکس/.test(input))) return null;
    const candidates: FitnessDisciplineCandidate[] = [{ discipline: 'yoga', score: 0.35, reasons: ['mobility-and-recovery-friendly'] }, { discipline: 'calisthenics', score: 0.35, reasons: ['bodyweight-friendly'] }, { discipline: 'gym', score: 0.30, reasons: ['equipment-flexible'] }];
    const goal = fitness.primaryGoal; const equipment = new Set(fitness.equipment ?? ['none']); const constraints = fitness.constraints ?? [];
    const hasConstraint = (key: string) => constraints.some((constraint: unknown) => typeof constraint === 'string' ? constraint === key : Boolean(constraint && typeof constraint === 'object' && (constraint as { key?: unknown }).key === key && ((constraint as { enabled?: unknown }).enabled ?? true)));
    if (/\byoga\b|یوگا/.test(input)) { candidates[0].score += 0.35; candidates[0].reasons.push('explicit-yoga-request'); }
    if (/calisthenics|کالیستنیکس/.test(input)) { candidates[1].score += 0.35; candidates[1].reasons.push('explicit-calisthenics-request'); }
    if (/\bgym\b|بدنسازی/.test(input)) { candidates[2].score += 0.35; candidates[2].reasons.push('explicit-gym-request'); }
    if (goal) { if (goal.kind === 'body_sculpt') { candidates[1].score += 0.15; candidates[0].score += 0.08; } if (goal.kind === 'strength') { candidates[2].score += 0.18; candidates[1].score += 0.12; } if (goal.kind === 'fat_loss') { candidates[1].score += 0.10; candidates[2].score += 0.08; } if (goal.avoidBulk) { candidates[0].score += 0.05; candidates[1].score += 0.04; } }
    if (equipment.has('none') && equipment.size === 1) { candidates[1].score += 0.20; candidates[2].score -= 0.12; }
    if (equipment.has('dumbbells') || equipment.has('barbell') || equipment.has('cable_machine')) candidates[2].score += 0.20;
    if (hasConstraint('low_impact')) { candidates[0].score += 0.15; candidates[1].score -= 0.04; }
    type FitnessWithLegacyMemory = typeof fitness & { decisionMemory?: NonNullable<typeof context.state.lifeContext>['decisionMemory'] };
    const memory = (fitness as FitnessWithLegacyMemory).decisionMemory ?? context.state.lifeContext?.decisionMemory; const decisionCount = memory?.decisions ?? 0; const prior = memory?.selectedFrequency?.[0]; const priorCount = prior?.count ?? 0;
    if (decisionCount >= 5 && memory?.changeSignal === 'stable' && prior) { const priorCandidate = candidates.find(c => c.discipline === prior.id); if (priorCandidate && priorCount >= 3) { priorCandidate.score += 0.04; priorCandidate.reasons.push(`prior-choice-pattern:${priorCount}`); } }
    candidates.sort((a, b) => b.score - a.score); const best = candidates[0]; const reasons = [...best.reasons, goal ? `primary-goal:${goal.kind}` : 'no-primary-goal', `target:${(fitness.targetAreas ?? []).join(',')}`, `equipment:${[...equipment].join(',')}`];
    if (decisionCount >= 5 && memory) reasons.push(`decision-history:${memory.changeSignal}`); if (prior && priorCount >= 3) reasons.push(`prior-choice-pattern:${priorCount}`);
    return { canDecide: context.reasoning.uncertainties.length === 0, confidence: Math.min(0.98, Math.max(0.35, best.score)), blockers: [...context.reasoning.uncertainties], intent: 'fitness-recommendation', recommendation: `Best training branch today: ${best.discipline}. ${reasons.join(' | ')}`, nextAction: `Generate a ${best.discipline} session using the user's fitness context`, candidates: candidates.map(c => ({ id: c.discipline, score: Number(c.score.toFixed(2)), rationale: c.reasons })) } as BrainDecisionResult & { candidates: unknown[] };
  }
}
