import { Injectable } from '@nestjs/common';

import { BrainOrchestratorService } from '../../personal-brain/services/brain-orchestrator.service';
import { NaturalActionExecutionService } from './natural-action-execution.service';

@Injectable()
export class AssistantService {
  constructor(
    private readonly brainOrchestratorService: BrainOrchestratorService,
    private readonly naturalActionExecutionService: NaturalActionExecutionService,
  ) {}

  async getStatus() {
    return {
      name: 'My Personal Assistant',
      status: 'brain foundation active',
    };
  }

  async process(input: string, userId: string) {
    const response = await this.brainOrchestratorService.processRequest(input, userId);
    if (!response.nextAction) return response;

    const execution = await this.naturalActionExecutionService.execute(input, userId, response);
    return {
      ...response,
      message: execution.executed ? execution.message : response.message,
      execution,
    };
  }
}
