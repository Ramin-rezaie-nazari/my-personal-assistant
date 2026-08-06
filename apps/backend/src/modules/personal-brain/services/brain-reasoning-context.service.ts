import { Injectable } from '@nestjs/common';

import { BrainStateService } from './brain-state.service';

import { BrainReasoningSignals } from '../types/brain-reasoning.types';

type BrainReasoningContext = {
  input: string;
  state: {
    context: unknown;
    memories: unknown[];
    goals: unknown[];
  };
  signals: BrainReasoningSignals;
};

@Injectable()
export class BrainReasoningContextService {
  constructor(private readonly brainStateService: BrainStateService) {}

  async build(input: string): Promise<BrainReasoningContext> {
    const state = await this.brainStateService.buildState(input);

    return {
      input,
      state,
      signals: {
        hasContext: Boolean(state.context),
        hasMemories: state.memories.length > 0,
        hasGoals: state.goals.length > 0,
      },
    };
  }
}
