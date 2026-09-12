import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ShoppingIntelligenceService } from '../services/shopping-intelligence.service';

@Controller('shopping-intelligence')
@UseGuards(JwtAuthGuard)
export class ShoppingIntelligenceController {
  constructor(private readonly shoppingService: ShoppingIntelligenceService) {}

  @Get()
  getShoppingPlan(@Request() req: { user: { id: string } }) {
    return this.shoppingService.createShoppingPlan(req.user.id);
  }
}
