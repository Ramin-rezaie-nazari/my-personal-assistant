import { Injectable } from '@nestjs/common';

@Injectable()
export class ResponsePlanningService {
  async createPlan() {
    await Promise.resolve();

    return {
      message: 'Response plan created',
    };
  }
}
