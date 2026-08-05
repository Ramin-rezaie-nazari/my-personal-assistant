import { Injectable } from '@nestjs/common';

@Injectable()
export class PlanningService {
  async createPlan() {
    await Promise.resolve();

    return {
      success: true,
      message: 'Planning Engine Ready',
    };
  }
}
