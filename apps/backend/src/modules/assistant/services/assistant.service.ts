import { Injectable } from '@nestjs/common';

import { BrainOrchestratorService } from '../../personal-brain/services/brain-orchestrator.service';

@Injectable()
export class AssistantService {
  constructor(
    private readonly brainOrchestratorService: BrainOrchestratorService,
  ) {}

  async getStatus() {
    return {
      name: 'My Personal Assistant',
      status: 'brain foundation active',
    };
  }

  async process(input: string, userId: string) {
    return this.brainOrchestratorService.processRequest(input, userId);
  }
}
