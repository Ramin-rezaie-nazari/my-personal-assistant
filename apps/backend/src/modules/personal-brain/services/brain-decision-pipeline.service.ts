import { Injectable } from '@nestjs/common';

import { BrainDecisionService } from './brain-decision.service';

type BrainDecisionPipelineResult = {
  allowed: boolean;
  confidence: number;
  blockers: string[];
  message: string;
};

@Injectable()
export class BrainDecisionPipelineService {
  constructor(private readonly brainDecisionService: BrainDecisionService) {}

  async run(): Promise<BrainDecisionPipelineResult> {
    const decision = await this.brainDecisionService.evaluateDecision();

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
