import { Injectable } from '@nestjs/common';

import { BrainDecisionService } from './brain-decision.service';

type BrainDecisionPipelineResult = {
  allowed: boolean;
  confidence: number;
  blockers: string[];
  message: string;
};

type BrainReasoningSignals = {
  hasContext: boolean;
  hasMemories: boolean;
  hasGoals: boolean;
};

@Injectable()
export class BrainDecisionPipelineService {
  constructor(private readonly brainDecisionService: BrainDecisionService) {}

  run(signals: BrainReasoningSignals): BrainDecisionPipelineResult {
    const decision = this.brainDecisionService.evaluateDecision(signals);

    return {
      allowed: decision.canDecide,
      confidence: decision.confidence,
      blockers: decision.blockers,
      message: decision.canDecide
        ? 'brain is ready for decision'
        : 'brain needs more information',
    };
  }
}
