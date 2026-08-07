import { Injectable } from '@nestjs/common';

import { BrainStateService } from './brain-state.service';
import { BrainReasoningEngineService } from './brain-reasoning-engine.service';

import { BrainReasoningContext } from '../types';

@Injectable()
export class BrainReasoningContextService {
  constructor(
    private readonly brainStateService: BrainStateService,
    private readonly brainReasoningEngineService: BrainReasoningEngineService,
  ) {}

  async build(input: string): Promise<BrainReasoningContext> {
    const state = await this.brainStateService.buildState(input);

    const signals = {
      hasContext: Boolean(state.context),
      hasMemories: state.memories.length > 0,
      hasGoals: state.goals.length > 0,
    };

    const reasoning = this.brainReasoningEngineService.analyze({
      input,
      signals,
    });

    return {
      input,
      state,
      signals,
      reasoning,
    };
  }
}
