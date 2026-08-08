import { Injectable } from '@nestjs/common';

import { BrainStateService } from './brain-state.service';
import { BrainReasoningEngineService } from './brain-reasoning-engine.service';

import { BrainReasoningContext, BrainReasoningSignals } from '../types';

@Injectable()
export class BrainReasoningContextService {
  constructor(
    private readonly brainStateService: BrainStateService,
    private readonly brainReasoningEngineService: BrainReasoningEngineService,
  ) {}

  async build(input: string): Promise<BrainReasoningContext> {
    const state = await this.brainStateService.buildState(input);

    const signals: BrainReasoningSignals = {
      hasContext: Boolean(state.context),
      hasMemories: state.memories.length > 0,
      hasGoals: state.goals.length > 0,
      memoryCount: state.memories.length,
      goalCount: state.goals.length,
      contextSource: state.context.source,
    };

    const reasoning = this.brainReasoningEngineService.analyze({
      input,
      userContext: state.userContext,
      signals,
    });

    return {
      input,
      userContext: state.userContext,
      state,
      signals,
      reasoning,
    };
  }
}
