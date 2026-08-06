import { Injectable } from '@nestjs/common';
import { BrainStateService } from './brain-state.service';

import { BrainContextService } from '../../brain-integration/services/brain-context.service';
import { BrainMemoryService } from '../../brain-integration/services/brain-memory.service';
import { BrainGoalService } from '../../brain-integration/services/brain-goal.service';
import { ContextEngineService } from '../../context-engine/services/context-engine.service';

@Injectable()
export class BrainOrchestratorService {
  constructor(
    private readonly brainStateService: BrainStateService,
    private readonly brainContextService: BrainContextService,
    private readonly brainMemoryService: BrainMemoryService,
    private readonly brainGoalService: BrainGoalService,
  ) {}
  constructor(
    private readonly brainStateService: BrainStateService,
    private readonly contextEngineService: ContextEngineService,
  ) {}
  async processRequest(input: string) {
    await Promise.resolve();

    const context = await this.contextEngineService.buildContext();

    const state = await this.brainStateService.buildState();

    return {
      state,
      message: 'Brain request processed',
      input,
      context,
    };
  }
}
