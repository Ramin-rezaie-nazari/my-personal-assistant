import { Injectable } from '@nestjs/common';

import { ContextEngineService } from '../../context-engine/services/context-engine.service';

import { BrainStateService } from './brain-state.service';

@Injectable()
export class BrainOrchestratorService {
  constructor(
    private readonly brainStateService: BrainStateService,
    private readonly contextEngineService: ContextEngineService,
  ) {}

  async processRequest(input: string) {
    const context = await this.contextEngineService.buildContext();

    const state = await this.brainStateService.buildState(input);

    return {
      state,
      message: 'Brain request processed',
      input,
      context,
    };
  }
}
