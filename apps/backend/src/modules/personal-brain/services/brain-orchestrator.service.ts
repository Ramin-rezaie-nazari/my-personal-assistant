import { Injectable } from '@nestjs/common';

import { ContextEngineService } from '../../context-engine/services/context-engine.service';

import { BrainDecisionPipelineService } from './brain-decision-pipeline.service';
import { BrainStateService } from './brain-state.service';

@Injectable()
export class BrainOrchestratorService {
  constructor(
    private readonly brainStateService: BrainStateService,
    private readonly contextEngineService: ContextEngineService,
    private readonly brainDecisionPipelineService: BrainDecisionPipelineService,
  ) {}

  async processRequest(input: string) {
    const context = await this.contextEngineService.buildContext();

    const state = await this.brainStateService.buildState(input);

    const decision = await this.brainDecisionPipelineService.run();

    if (!decision.allowed) {
      return {
        state,
        decision,
        input,
        context,
        message: 'Brain needs more information',
        requiredInformation: decision.blockers,
      };
    }

    return {
      state,
      decision,
      input,
      context,
      message: 'Brain request processed',
    };
  }
}
