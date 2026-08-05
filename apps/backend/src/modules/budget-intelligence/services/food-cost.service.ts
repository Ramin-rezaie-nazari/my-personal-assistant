import { Injectable } from '@nestjs/common';

@Injectable()
export class FoodCostService {
  async estimateCost() {
    await Promise.resolve();

    return {
      message: 'Food cost estimated',
    };
  }
}
