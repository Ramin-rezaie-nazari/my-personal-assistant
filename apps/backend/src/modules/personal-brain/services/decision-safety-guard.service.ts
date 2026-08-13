import { Injectable } from '@nestjs/common';
import { DecisionCandidate, UnifiedDecision } from './unified-decision-engine.service';

export type DecisionSafetyPolicy = {
  maxActions?: number;
  maxPerDomain?: number;
  blockedDomains?: DecisionCandidate['domain'][];
};

@Injectable()
export class DecisionSafetyGuardService {
  sanitize(result: UnifiedDecision, policy: DecisionSafetyPolicy = {}): UnifiedDecision {
    const blockedDomains = new Set(policy.blockedDomains ?? []);
    const maxActions = Math.max(1, (policy.maxActions ?? result.selected.length) || 1);
    const maxPerDomain = Math.max(1, policy.maxPerDomain ?? Number.MAX_SAFE_INTEGER);
    const domainCounts = new Map<string, number>();
    const selected: DecisionCandidate[] = [];
    const safetyRejected: DecisionCandidate[] = [];

    for (const candidate of result.selected) {
      const count = domainCounts.get(candidate.domain) ?? 0;
      if (blockedDomains.has(candidate.domain) || count >= maxPerDomain || selected.length >= maxActions) {
        safetyRejected.push(candidate);
        continue;
      }
      domainCounts.set(candidate.domain, count + 1);
      selected.push(candidate);
    }

    return {
      ...result,
      selected,
      rejected: [...result.rejected, ...safetyRejected],
      reason: safetyRejected.length ? `${result.reason};safety_guard_applied` : result.reason,
    };
  }
}
