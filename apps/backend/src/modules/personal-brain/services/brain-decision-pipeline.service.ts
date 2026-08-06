import { Injectable } from '@nestjs/common';

import { BrainDecisionService } from './brain-decision.service';

type BrainDecisionPipelineResult = {
  allowed: boolean;
  confidence: number;
  blockers: string[];
  message: string;
};

type BrainDecisionState = {
  context: unknown;
  memories: unknown[];
  goals: unknown[];
};

@Injectable()
export class BrainDecisionPipelineService {
  constructor(private readonly brainDecisionService: BrainDecisionService) {}

  async run(state: BrainDecisionState): Promise<BrainDecisionPipelineResult> {
    await Promise.resolve();

    const decision = this.brainDecisionService.evaluateDecision(state);

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
