import { Injectable } from '@nestjs/common';

import { BrainDecisionService } from './brain-decision.service';
import { BrainDecisionPipelineResult, BrainReasoningContext } from '../types';

@Injectable()
export class BrainDecisionPipelineService {
  constructor(private readonly brainDecisionService: BrainDecisionService) {}

  run(context: BrainReasoningContext): BrainDecisionPipelineResult {
    const decision = this.brainDecisionService.evaluateDecision(context);

    return {
      ...decision,
      message: decision.canDecide
        ? 'brain is ready for decision'
        : 'brain needs more information',
    };
  }
}
