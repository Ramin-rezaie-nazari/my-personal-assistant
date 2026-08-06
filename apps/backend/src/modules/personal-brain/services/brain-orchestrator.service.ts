import { Injectable } from '@nestjs/common';

import { BrainDecisionPipelineService } from './brain-decision-pipeline.service';
import { BrainReasoningContextService } from './brain-reasoning-context.service';
import { BrainReasoningEngineService } from './brain-reasoning-engine.service';

@Injectable()
export class BrainOrchestratorService {
  constructor(
    private readonly brainReasoningContextService: BrainReasoningContextService,
    private readonly brainReasoningEngineService: BrainReasoningEngineService,
    private readonly brainDecisionPipelineService: BrainDecisionPipelineService,
  ) {}

  async processRequest(input: string) {
    const reasoningContext =
      await this.brainReasoningContextService.build(input);

    const reasoning = this.brainReasoningEngineService.analyze({
      input,
      signals: reasoningContext.signals,
    });

    const decision = this.brainDecisionPipelineService.run(
      reasoningContext.signals,
    );

    if (!decision.allowed) {
      return {
        reasoningContext,
        reasoning,
        decision,
        input,
        message: 'Brain needs more information',
        requiredInformation: decision.blockers,
      };
    }

    return {
      reasoningContext,
      reasoning,
      decision,
      input,
      message: 'Brain request processed',
    };
  }
}
