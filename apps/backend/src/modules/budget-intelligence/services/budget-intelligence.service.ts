import { Injectable } from '@nestjs/common';

@Injectable()
export class BudgetIntelligenceService {
  async createPlan() {
    await Promise.resolve();

    return {
      message: 'Smart food budget plan created',
      budget: null,
      suggestions: [],
    };
  }
}
