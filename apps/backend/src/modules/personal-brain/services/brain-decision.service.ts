import { Injectable } from '@nestjs/common';

import { DecisionReadinessService } from './decision-readiness.service';

@Injectable()
export class BrainDecisionService {
  constructor(
    private readonly decisionReadinessService: DecisionReadinessService,
  ) {}

  async evaluateDecision() {
    const readiness = await this.decisionReadinessService.evaluate();

    return {
      canDecide: readiness.ready,
      confidence: readiness.score,
      blockers: readiness.reasons,
    };
  }
}
