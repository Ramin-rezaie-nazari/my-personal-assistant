import { Injectable } from '@nestjs/common';
import { ShoppingService } from '../../shopping/shopping.service';

@Injectable()
export class ShoppingIntelligenceService {
  constructor(private readonly shopping: ShoppingService) {}

  async createShoppingPlan(userId: string) {
    const [smartItems, basket] = await Promise.all([
      this.shopping.smartList(userId),
      this.shopping.listBasket(userId),
    ]);

    return {
      userId,
      generatedDeterministically: true,
      items: smartItems,
      basket,
      counts: {
        recommended: smartItems.length,
        openBasket: basket.length,
      },
    };
  }
}
