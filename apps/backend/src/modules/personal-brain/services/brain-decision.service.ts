import { Injectable } from '@nestjs/common';

import { DecisionReadinessService } from './decision-readiness.service';

type BrainState = {
  context: unknown;
  memories: unknown[];
  goals: unknown[];
};

@Injectable()
export class BrainDecisionService {
  constructor(
    private readonly decisionReadinessService: DecisionReadinessService,
  ) {}

  evaluateDecision(state: BrainState) {
    const readiness = this.decisionReadinessService.evaluate(state);

    return {
      canDecide: readiness.ready,
      confidence: readiness.score,
      blockers: readiness.reasons,
    };
  }
}
