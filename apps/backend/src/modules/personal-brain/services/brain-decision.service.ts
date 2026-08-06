import { Injectable } from '@nestjs/common';

import { DecisionReadinessService } from './decision-readiness.service';

type BrainReasoningSignals = {
  hasContext: boolean;
  hasMemories: boolean;
  hasGoals: boolean;
};

@Injectable()
export class BrainDecisionService {
  constructor(
    private readonly decisionReadinessService: DecisionReadinessService,
  ) {}

  evaluateDecision(signals: BrainReasoningSignals) {
    const readiness = this.decisionReadinessService.evaluate(signals);

    return {
      canDecide: readiness.ready,
      confidence: readiness.score,
      blockers: readiness.reasons,
    };
  }
}
