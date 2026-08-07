import { Injectable } from '@nestjs/common';

import { BrainGoal } from '../types';

@Injectable()
export class BrainGoalService {
  async getGoals(): Promise<BrainGoal[]> {
    await Promise.resolve();

    return [];
  }
}
