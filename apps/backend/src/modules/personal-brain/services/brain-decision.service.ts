import { Injectable } from '@nestjs/common';

import { BrainDecisionResult, BrainReasoningContext } from '../types';

@Injectable()
export class BrainDecisionService {
  evaluateDecision(context: BrainReasoningContext): BrainDecisionResult {
    const blockers = [...context.reasoning.uncertainties];

    return {
      canDecide: blockers.length === 0,
      confidence: context.reasoning.confidence,
      blockers,
    };
  }
}
