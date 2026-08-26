import { Injectable } from '@nestjs/common';

@Injectable()
export class ShoppingIntelligenceService {
  async createShoppingPlan(_userId?: string) {
    await Promise.resolve();

    return {
      message: 'Smart shopping plan created',
      items: [],
      estimatedCost: 0,
    };
  }
}
