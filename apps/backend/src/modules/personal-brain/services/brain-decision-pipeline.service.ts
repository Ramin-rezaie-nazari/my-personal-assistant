import { Injectable } from '@nestjs/common';

import { BrainDecisionService } from './brain-decision.service';
import { BrainReasoningContext } from '../types/brain-reasoning-context.types';

type BrainDecisionPipelineResult = {
  allowed: boolean;
  confidence: number;
  blockers: string[];
  message: string;
};

@Injectable()
export class BrainDecisionPipelineService {
  constructor(private readonly brainDecisionService: BrainDecisionService) {}

  run(context: BrainReasoningContext): BrainDecisionPipelineResult {
    const decision = this.brainDecisionService.evaluateDecision(
      context.signals,
    );

    return {
      allowed: decision.canDecide,
      confidence: context.reasoning.confidence,
      blockers: [...decision.blockers, ...context.reasoning.uncertainties],
      message: decision.canDecide
        ? 'brain is ready for decision'
        : 'brain needs more information',
    };
  }
}
