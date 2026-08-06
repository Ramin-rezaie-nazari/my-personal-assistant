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

  run(reasoningContext: BrainReasoningContext): BrainDecisionPipelineResult {
    const decision = this.brainDecisionService.evaluateDecision(
      reasoningContext.signals,
    );

    return {
      allowed: decision.canDecide,
      confidence: reasoningContext.reasoning.confidence,
      blockers: [
        ...decision.blockers,
        ...reasoningContext.reasoning.uncertainties,
      ],
      message: decision.canDecide
        ? 'brain is ready for decision'
        : 'brain needs more information',
    };
  }
}
