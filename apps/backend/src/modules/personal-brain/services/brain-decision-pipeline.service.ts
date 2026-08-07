import { Injectable } from '@nestjs/common';

import {
  BrainDecisionResult,
  BrainDecisionService,
} from './brain-decision.service';
import { BrainReasoningContext } from '../types/brain-reasoning-context.types';

type BrainDecisionPipelineResult = BrainDecisionResult & {
  message: string;
};

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
