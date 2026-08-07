import { Injectable } from '@nestjs/common';

import { BrainDecisionPipelineService } from './brain-decision-pipeline.service';
import { BrainReasoningContextService } from './brain-reasoning-context.service';
import { BrainResponse } from '../types';

@Injectable()
export class BrainOrchestratorService {
  constructor(
    private readonly brainReasoningContextService: BrainReasoningContextService,
    private readonly brainDecisionPipelineService: BrainDecisionPipelineService,
  ) {}

  async processRequest(input: string): Promise<BrainResponse> {
    const reasoningContext =
      await this.brainReasoningContextService.build(input);

    const decision = this.brainDecisionPipelineService.run(reasoningContext);

    return {
      message:
        decision.recommendation ?? 'I need more information to help you better',

      intent: decision.intent ?? 'general',

      confidence: decision.confidence,

      nextAction: decision.nextAction,

      metadata: {
        blockers: decision.blockers,
      },
    };
  }
}
