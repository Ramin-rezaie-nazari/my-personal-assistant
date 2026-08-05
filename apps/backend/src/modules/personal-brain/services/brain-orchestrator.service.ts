import { Injectable } from '@nestjs/common';
import { ContextEngineService } from '../../context-engine/services/context-engine.service';

@Injectable()
export class BrainOrchestratorService {
  constructor(private readonly contextEngineService: ContextEngineService) {}
  async processRequest(input: string) {
    await Promise.resolve();

    const context = await this.contextEngineService.buildContext();

    return {
      message: 'Brain request processed',
      input,
      context,
    };
  }
}
