import { Injectable } from '@nestjs/common';

@Injectable()
export class BrainContextService {
  async getContext() {
    await Promise.resolve();

    return {
      timestamp: new Date().toISOString(),
      source: 'brain-context',
    };
  }
}
