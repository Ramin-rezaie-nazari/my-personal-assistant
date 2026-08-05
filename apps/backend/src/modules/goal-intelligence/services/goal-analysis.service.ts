import { Injectable } from '@nestjs/common';

@Injectable()
export class GoalAnalysisService {
  async analyzeGoal() {
    await Promise.resolve();

    return {
      analyzed: true,
    };
  }
}
