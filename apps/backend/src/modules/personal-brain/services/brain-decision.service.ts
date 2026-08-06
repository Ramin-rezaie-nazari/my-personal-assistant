import { Injectable } from '@nestjs/common';

import { BrainReasoningContext } from '../types/brain-reasoning-context.types';

type BrainDecisionResult = {
  canDecide: boolean;
  confidence: number;
  blockers: string[];
};

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
