import { Injectable } from '@nestjs/common';
import { ConflictResolution } from './preference-conflict-resolver.service';
import { UnifiedDecision } from './unified-decision-engine.service';

export type DecisionExplanation = {
  summary: string;
  details: string;
  confidence: number | null;
  reasons: string[];
  rejectedReasons: string[];
  blockedReasons: string[];
  conflictReason?: string;
};

@Injectable()
export class DecisionExplanationService {
  explain(decision: UnifiedDecision, conflict?: ConflictResolution): DecisionExplanation {
    const selected = decision.selected;
    const reasons = [
      ...decision.rationale ?? [],
      ...selected.map((item) => this.candidateReason(item)),
    ].filter(Boolean);

    const rejectedReasons = decision.rejected.map((item) => this.rejectionReason(item, selected[0]));
    const blockedReasons = decision.blocked.map((item) => this.blockReason(item));
    const confidence = selected.length ? Math.max(...selected.map((item) => item.confidence)) : null;
    const summary = this.summary(decision, selected[0]);

    return {
      summary,
      details: this.details(decision, selected[0], reasons, rejectedReasons, blockedReasons, conflict),
      confidence,
      reasons: this.unique(reasons).slice(0, 8),
      rejectedReasons: rejectedReasons.slice(0, 8),
      blockedReasons: blockedReasons.slice(0, 8),
      conflictReason: conflict?.reason,
    };
  }

  private summary(decision: UnifiedDecision, selected?: UnifiedDecision['selected'][number]): string {
    if (!selected) return 'I did not choose an action because nothing was safe and appropriate to execute right now.';
    return `I chose ${this.actionLabel(selected.action)} because it best matched your current priorities and constraints.`;
  }

  private details(
    decision: UnifiedDecision,
    selected: UnifiedDecision['selected'][number] | undefined,
    reasons: string[],
    rejected: string[],
    blocked: string[],
    conflict?: ConflictResolution,
  ): string {
    const parts: string[] = [];
    if (selected) parts.push(`I selected ${this.actionLabel(selected.action)} in the ${selected.domain} area.`);
    if (reasons.length) parts.push(`Why: ${this.unique(reasons).slice(0, 5).join(' ')}`);
    if (rejected.length) parts.push(`I did not prioritize ${this.unique(rejected).slice(0, 3).join(' ')}`);
    if (blocked.length) parts.push(`I blocked ${this.unique(blocked).slice(0, 3).join(' ')}`);
    if (conflict?.reason) parts.push(`Conflict handling: ${this.humanizeReason(conflict.reason)}.`);
    if (selected) parts.push(`Confidence: ${Math.round(selected.confidence * 100)}%.`);
    else if (decision.reason) parts.push(`Decision state: ${this.humanizeReason(decision.reason)}.`);
    return parts.join(' ');
  }

  private candidateReason(candidate: UnifiedDecision['selected'][number]): string {
    const reasons: string[] = [];
    if (candidate.hardConstraint) reasons.push(`${this.actionLabel(candidate.action)} satisfied a required constraint.`);
    if ((candidate.goalAlignment ?? 0) >= 0.8) reasons.push(`${this.actionLabel(candidate.action)} strongly matched the active goal.`);
    if ((candidate.goalDownside ?? 0) >= 0.5) reasons.push(`${this.actionLabel(candidate.action)} had a meaningful downside for the longer-term goal.`);
    if (candidate.source) reasons.push(`The recommendation came from ${candidate.source}.`);
    return reasons.join(' ');
  }

  private rejectionReason(candidate: UnifiedDecision['rejected'][number], selected?: UnifiedDecision['selected'][number]): string {
    if ((candidate.goalDownside ?? 0) > (selected?.goalDownside ?? 0)) return `${this.actionLabel(candidate.action)} was not prioritized because it had a higher downside for the current goal.`;
    if ((candidate.goalAlignment ?? 0) < (selected?.goalAlignment ?? 0)) return `${this.actionLabel(candidate.action)} matched the current goal less closely than the selected option.`;
    if (candidate.confidence < (selected?.confidence ?? 1)) return `${this.actionLabel(candidate.action)} had lower confidence than the selected option.`;
    return `${this.actionLabel(candidate.action)} ranked below the selected option after the current priority and score checks.`;
  }

  private blockReason(candidate: UnifiedDecision['blocked'][number]): string {
    return `${this.actionLabel(candidate.action)} was blocked because ${candidate.blockedBy?.join(', ') || 'a safety or prerequisite constraint'} applied.`;
  }

  private actionLabel(action: string): string {
    return action.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private humanizeReason(reason: string): string {
    return reason.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private unique(items: string[]): string[] {
    return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
  }
}
