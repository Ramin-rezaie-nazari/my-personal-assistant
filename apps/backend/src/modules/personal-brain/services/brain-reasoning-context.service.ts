import { Injectable } from '@nestjs/common';

import { BrainStateService } from './brain-state.service';

type BrainReasoningContext = {
  input: string;
  state: {
    context: unknown;
    memories: unknown[];
    goals: unknown[];
  };
  confidence: number;
};

@Injectable()
export class BrainReasoningContextService {
  constructor(private readonly brainStateService: BrainStateService) {}

  async build(input: string): Promise<BrainReasoningContext> {
    const state = await this.brainStateService.buildState(input);

    const hasContext = Boolean(state.context);
    const hasMemories = state.memories.length > 0;
    const hasGoals = state.goals.length > 0;

    const confidence =
      [hasContext, hasMemories, hasGoals].filter(Boolean).length / 3;

    return {
      input,
      state,
      confidence,
    };
  }
}
