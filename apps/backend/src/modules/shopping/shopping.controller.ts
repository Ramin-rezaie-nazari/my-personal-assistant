import { Controller, Get, Request, UseGuards } from '@nestjs/common';
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
}
