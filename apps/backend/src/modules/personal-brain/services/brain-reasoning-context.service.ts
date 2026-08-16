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

  async build(input: string, userId: string): Promise<BrainReasoningContext> {
    const state = await this.brainStateService.buildState(input, userId);
    const lifeContext = state.lifeContext;
    const lifeContextQuality = this.calculateLifeContextQuality(lifeContext);

    const signals: BrainReasoningSignals = {
      hasContext: Boolean(state.context),
      hasMemories: state.memories.length > 0,
      hasGoals: state.goals.length > 0,
      hasLifeContext: Boolean(lifeContext),
      memoryCount: state.memories.length,
      goalCount: state.goals.length,
      contextSource: state.context.source,
      lifeContextQuality,
    };

    const reasoning = this.brainReasoningEngineService.analyze({
      input,
      userContext: state.userContext,
      signals,
      lifeContext,
    });

    return {
      input,
      userContext: state.userContext,
      state,
      signals,
      reasoning,
    };
  }

  private calculateLifeContextQuality(
    context: BrainReasoningContext['state']['lifeContext'],
  ): number {
    if (!context) return 0;

    const scores = [
      context.habits.active > 0 ? 1 : 0.5,
      context.reminders.next ? 1 : 0.5,
      context.supplements.total > 0 ? 1 : 0.5,
      context.goals.active > 0 ? 1 : 0.5,
    ];

    return Number(
      (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(
        3,
      ),
    );
  }
}
