import { Injectable } from '@nestjs/common';
import type { ConflictResolution } from './preference-conflict-resolver.service';
import type { UnifiedDecision, DecisionCandidate } from './unified-decision-engine.service';
import type { BrainDecisionPipelineResult, BrainReasoningContext } from '../types';

export type DecisionExplanation = { summary: string; details: string; confidence: number | null; reasons: string[]; rejectedReasons: string[]; blockedReasons: string[]; historicalReasons: string[]; conflictReason?: string };

@Injectable()
export class DecisionExplanationService {
  explain(decision: UnifiedDecision, conflict?: ConflictResolution): DecisionExplanation {
    const selected = decision.selected; const reasons = [...(decision.rationale ?? []), ...selected.map((item) => this.candidateReason(item))].filter(Boolean);
    const rejectedReasons = decision.rejected.map((item) => this.rejectionReason(item, selected[0])); const blockedReasons = decision.blocked.map((item) => this.blockReason(item)); const confidence = selected.length ? Math.max(...selected.map((item) => item.confidence)) : null;
    return this.compose(selected.length ? `I chose ${this.actionLabel(selected[0].action)} because it best matched your current priorities and constraints.` : 'I did not choose an action because nothing was safe and appropriate to execute right now.', selected.length ? `I selected ${this.actionLabel(selected[0].action)} in the ${selected[0].domain} area.` : 'No action was selected.', confidence, reasons, rejectedReasons, blockedReasons, [], conflict?.reason);
  }

  explainBrain(context: BrainReasoningContext, decision: BrainDecisionPipelineResult): DecisionExplanation {
    const fitness = context.state.lifeContext?.fitness; const reasons: string[] = [];
    if (fitness?.primaryGoal?.active) reasons.push(`Your active goal is ${fitness.primaryGoal.title}.`);
    if (fitness?.targetAreas?.length) reasons.push(`You asked me to focus on ${fitness.targetAreas.join(', ')}.`);
    if (fitness?.equipment?.length) reasons.push(`I considered the equipment you currently have: ${fitness.equipment.join(', ')}.`);
    if (fitness?.primaryGoal?.avoidBulk) reasons.push('You asked to avoid excessive muscle bulk, so I treated that as a constraint.');
    const performance = fitness?.performanceMemory ?? fitness?.performance;
    if (performance?.formTrend != null) reasons.push(`Your recent form trend is ${this.trendText(performance.formTrend)}.`);
    if (performance?.completionTrend != null) reasons.push(`Your recent completion trend is ${this.trendText(performance.completionTrend)}.`);
    if (performance?.recoveryTrend != null) reasons.push(`Your recovery trend is ${this.trendText(performance.recoveryTrend)}.`);
    const summary = decision.canDecide ? `I chose ${this.actionLabel(decision.recommendation ?? decision.nextAction ?? 'this option')} based on what I know about you right now.` : 'I did not make a firm decision because I still need more information.';
    const details = decision.blockers.length ? `I held back because ${decision.blockers.slice(0, 3).join(', ')}.` : decision.message || 'I used your current goals, preferences, history, and constraints.';
    return this.compose(summary, details, decision.confidence, reasons, [], decision.blockers.slice(0, 5), decision.historicalReasons ?? []);
  }

  fromCoachAction(title: string, message: string, priority: string, evidence: string[]): DecisionExplanation { const reasons = this.unique(evidence); const priorityText = priority === 'critical' ? 'I treated this as urgent.' : priority === 'high' ? 'I gave this higher priority.' : 'I kept this as a lower-pressure suggestion.'; return this.compose(`${title}.`, message, null, [priorityText, ...reasons], [], [], []); }
  private compose(summary: string, baseDetails: string, confidence: number | null, reasons: string[], rejectedReasons: string[], blockedReasons: string[], historicalReasons: string[], conflictReason?: string): DecisionExplanation { const uniqueReasons = this.unique(reasons).slice(0, 8); const uniqueHistorical = this.unique(historicalReasons).slice(0, 5); const details = [baseDetails, uniqueReasons.length ? `Why: ${uniqueReasons.slice(0, 5).join(' ')}` : '', uniqueHistorical.length ? `From your history: ${uniqueHistorical.slice(0, 3).join(' ')}` : '', rejectedReasons.length ? `I did not prioritize: ${this.unique(rejectedReasons).slice(0, 3).join(' ')}` : '', blockedReasons.length ? `Blocked: ${this.unique(blockedReasons).slice(0, 3).join(' ')}` : '', conflictReason ? `Conflict handling: ${this.humanizeReason(conflictReason)}.` : '', confidence != null ? `Confidence: ${Math.round(confidence * 100)}%.` : ''].filter(Boolean).join(' '); return { summary, details, confidence, reasons: uniqueReasons, rejectedReasons: this.unique(rejectedReasons).slice(0, 8), blockedReasons: this.unique(blockedReasons).slice(0, 8), historicalReasons: uniqueHistorical, conflictReason }; }
  private candidateReason(candidate: DecisionCandidate): string { const reasons: string[] = []; if (candidate.hardConstraint) reasons.push(`${this.actionLabel(candidate.action)} satisfied a required constraint.`); if ((candidate.goalAlignment ?? 0) >= 0.8) reasons.push(`${this.actionLabel(candidate.action)} strongly matched the active goal.`); if ((candidate.goalDownside ?? 0) >= 0.5) reasons.push(`${this.actionLabel(candidate.action)} had a meaningful downside for the longer-term goal.`); if (candidate.source) reasons.push(`The recommendation came from ${candidate.source}.`); return reasons.join(' '); }
  private rejectionReason(candidate: DecisionCandidate, selected?: DecisionCandidate): string { if ((candidate.goalDownside ?? 0) > (selected?.goalDownside ?? 0)) return `${this.actionLabel(candidate.action)} had a higher downside for the current goal.`; if ((candidate.goalAlignment ?? 0) < (selected?.goalAlignment ?? 0)) return `${this.actionLabel(candidate.action)} matched the current goal less closely.`; if (candidate.confidence < (selected?.confidence ?? 1)) return `${this.actionLabel(candidate.action)} had lower confidence.`; return `${this.actionLabel(candidate.action)} ranked below the selected option.`; }
  private blockReason(candidate: DecisionCandidate): string { return `${this.actionLabel(candidate.action)} was blocked by ${candidate.blockedBy?.join(', ') || 'a prerequisite or safety constraint'}.`; }
  private trendText(value: number): string { const percent = Math.round(Math.abs(value) * 100); if (value > 0) return `improving by about ${percent}%`; if (value < 0) return `declining by about ${percent}%`; return 'stable'; }
  private actionLabel(action: string): string { return action.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()); }
  private humanizeReason(reason: string): string { return reason.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()); }
  private unique(items: string[]): string[] { return [...new Set(items.map((item) => item.trim()).filter(Boolean))]; }
}
