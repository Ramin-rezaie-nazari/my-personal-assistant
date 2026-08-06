import { Injectable } from '@nestjs/common';

import { BrainDecisionPipelineService } from './brain-decision-pipeline.service';
import { BrainReasoningContextService } from './brain-reasoning-context.service';

@Injectable()
export class BrainOrchestratorService {
  constructor(
    private readonly brainReasoningContextService: BrainReasoningContextService,
    private readonly brainDecisionPipelineService: BrainDecisionPipelineService,
  ) {}

  async processRequest(input: string) {
    const reasoningContext =
      await this.brainReasoningContextService.build(input);

    const decision = await this.brainDecisionPipelineService.run(
      reasoningContext.signals,
    );

    if (!decision.allowed) {
      return {
        reasoningContext,
        decision,
        input,
        message: 'Brain needs more information',
        requiredInformation: decision.blockers,
      };
    }

    return {
      reasoningContext,
      decision,
      input,
      message: 'Brain request processed',
    };
  }
}
