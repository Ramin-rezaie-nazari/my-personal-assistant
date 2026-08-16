import { Injectable } from '@nestjs/common';
import { DecisionCandidate } from './unified-decision-engine.service';
export type ReplanTrigger = 'constraint_changed' | 'candidate_expired' | 'user_feedback' | 'higher_priority_action' | 'context_changed';

@Injectable()
export class DecisionReplanPolicyService {
  shouldReplan(trigger: ReplanTrigger, current: DecisionCandidate | null, replacement: DecisionCandidate | null): boolean {
    if (!current) return Boolean(replacement);
    if (!replacement) return trigger === 'constraint_changed' || trigger === 'candidate_expired' || trigger === 'context_changed';
    if (trigger === 'user_feedback' || trigger === 'constraint_changed' || trigger === 'candidate_expired') return true;
    const currentWeight = this.weight(current); const replacementWeight = this.weight(replacement);
    if (trigger === 'higher_priority_action') return replacementWeight > currentWeight;
    return replacementWeight > currentWeight + 0.15 || (replacement.score - current.score >= 0.2);
  }
  private weight(candidate: DecisionCandidate): number { return Math.max(0, Math.min(1, candidate.priority ?? 0.5)) * 0.4 + Math.max(0, Math.min(1, candidate.confidence)) * 0.3 + Math.max(0, Math.min(1, candidate.score)) * 0.3; }
}
