import { Injectable } from '@nestjs/common';

import { BrainContext } from '../types';

@Injectable()
export class BrainContextService {
  async getContext(): Promise<BrainContext> {
    await Promise.resolve();

    return {
      timestamp: new Date().toISOString(),
      source: 'brain-context',
    };
  }
}
