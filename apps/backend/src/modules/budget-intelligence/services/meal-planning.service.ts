import { Injectable } from '@nestjs/common';

@Injectable()
export class MealPlanningService {
  async createMealBudgetPlan() {
    await Promise.resolve();

    return {
      message: 'Meal budget plan created',
    };
  }
}
