import { Injectable } from '@nestjs/common';

@Injectable()
export class BrainGoalService {
  async getGoals() {
    await Promise.resolve();

    return [];
  }
}
