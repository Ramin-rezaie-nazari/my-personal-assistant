import { Injectable } from '@nestjs/common';

@Injectable()
export class BrainOrchestratorService {
  async processRequest(input: string) {
    await Promise.resolve();

    return {
      message: 'Brain request processed',
      input,
    };
  }
}
