import { Injectable } from '@nestjs/common';

@Injectable()
export class LearningService {
  async learnFromAction() {
    await Promise.resolve();

    return {
      message: 'Learning completed',
    };
  }

  async createInsight() {
    await Promise.resolve();

    return {
      message: 'Insight created',
    };
  }
}
