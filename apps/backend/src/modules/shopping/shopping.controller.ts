import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShoppingService } from './shopping.service';

@Controller('shopping')
@UseGuards(JwtAuthGuard)
export class ShoppingController {
  constructor(private readonly shopping: ShoppingService) {}

  @Get('smart')
  smartList(@Request() req: { user: { id: string } }) {
    return this.shopping.smartList(req.user.id);
  }

  @Post('from-recipe')
  addFromRecipe(@Request() req: { user: { id: string } }, @Body() body: { recipeId: string; items: Array<{ foodId: string; quantity: number; unit: string }> }) {
    return this.shopping.addRecipeMissing(req.user.id, body.recipeId, body.items ?? []);
  }
}
