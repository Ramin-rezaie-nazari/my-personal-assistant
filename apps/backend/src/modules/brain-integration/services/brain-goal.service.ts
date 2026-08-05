import { Injectable } from '@nestjs/common';

@Injectable()
export class BrainGoalService {
  async getActiveGoals() {
    await Promise.resolve();

    return {
      goalsReady: true,
    };
  }
}
