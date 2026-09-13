import { Injectable } from '@nestjs/common';

import { BrainContext } from '../types';

@Injectable()
export class BrainContextService {
  async getContext(userId?: string): Promise<BrainContext> {
    return {
      timestamp: new Date().toISOString(),
      source: userId ? 'brain-context:user' : 'brain-context',
    };
  }
}
