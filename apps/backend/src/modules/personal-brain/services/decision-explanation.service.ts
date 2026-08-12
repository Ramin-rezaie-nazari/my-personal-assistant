import { Injectable } from '@nestjs/common';
import { ConflictResolution } from './preference-conflict-resolver.service';
import { UnifiedDecision } from './unified-decision-engine.service';

@Injectable()
export class DecisionExplanationService {
  explain(decision: UnifiedDecision, conflict?: ConflictResolution) {
    const selected = decision.selected.map((item) => ({ id: item.id, domain: item.domain, action: item.action, score: item.score, confidence: item.confidence }));
    return {
      summary: selected.length ? `Selected ${selected.length} action(s) after safety and priority checks.` : 'No action is safe or appropriate to execute right now.',
      reason: decision.reason,
      selected,
      rejected: decision.rejected.map((item) => ({ id: item.id, domain: item.domain, action: item.action })),
      blocked: decision.blocked.map((item) => ({ id: item.id, domain: item.domain, action: item.action })),
      conflictResolution: conflict ? { reason: conflict.reason, selected: conflict.selected?.value ?? null } : null,
    };
  }
}
