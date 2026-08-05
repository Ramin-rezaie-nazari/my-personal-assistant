import { Injectable } from '@nestjs/common';

@Injectable()
export class GoalPlanningService {
  async createGoalPlan() {
    await Promise.resolve();

    return {
      planCreated: true,
    };
  }
}
