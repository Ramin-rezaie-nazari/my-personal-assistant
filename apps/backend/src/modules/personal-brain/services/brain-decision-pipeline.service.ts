import { Injectable } from '@nestjs/common';

import { BrainStateService } from './brain-state.service';
import { BrainDecisionService } from './brain-decision.service';

type BrainDecisionPipelineResult = {
  allowed: boolean;
  confidence: number;
  blockers: string[];
  message: string;
};

@Injectable()
export class BrainDecisionPipelineService {
  constructor(
    private readonly brainStateService: BrainStateService,
    private readonly brainDecisionService: BrainDecisionService,
  ) {}

  async run(): Promise<BrainDecisionPipelineResult> {
    const state = await this.brainStateService.buildState();

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
