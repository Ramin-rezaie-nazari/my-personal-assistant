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

    const decision = this.brainDecisionPipelineService.run(reasoningContext);

    if (!decision.allowed) {
      return {
        input,
        reasoning: reasoningContext.reasoning,
        decision,
        message: 'Brain needs more information',
        requiredInformation: decision.blockers,
      };
    }

    return {
      input,
      reasoning: reasoningContext.reasoning,
      decision,
      message: 'Brain request processed',
    };
  }
}
