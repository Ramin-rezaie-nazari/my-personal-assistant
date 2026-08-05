import { Controller, Get } from '@nestjs/common';
import { ShoppingIntelligenceService } from '../services/shopping-intelligence.service';

@Controller('shopping-intelligence')
export class ShoppingIntelligenceController {
  constructor(private readonly shoppingService: ShoppingIntelligenceService) {}

  @Get()
  getShoppingPlan() {
    return this.shoppingService.createShoppingPlan();
  }
}
