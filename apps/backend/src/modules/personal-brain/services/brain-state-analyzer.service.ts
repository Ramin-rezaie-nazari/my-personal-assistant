import { Injectable } from '@nestjs/common';

import { BrainStateService } from './brain-state.service';

@Injectable()
export class BrainStateAnalyzerService {
  constructor(private readonly brainStateService: BrainStateService) {}

  async analyze(userId: string) {
    const state = await this.brainStateService.buildState('', userId);

    return {
      state,
      readiness: {
        hasContext: Boolean(state.context),
        hasMemories: Array.isArray(state.memories),
        hasGoals: Array.isArray(state.goals),
      },
    };
  }
}
