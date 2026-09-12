import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AddRecipeMissingDto,
  AddToBasketDto,
} from './dto/shopping.dto';
import { ShoppingService } from './shopping.service';

@Controller('shopping')
@UseGuards(JwtAuthGuard)
export class ShoppingController {
  constructor(private readonly shopping: ShoppingService) {}

  @Get('smart')
  smartList(@Request() req: { user: { id: string } }) {
    return this.shopping.smartList(req.user.id);
  }

  @Get('basket')
  basket(@Request() req: { user: { id: string } }) {
    return this.shopping.listBasket(req.user.id);
  }

  @Post('basket')
  add(
    @Request() req: { user: { id: string } },
    @Body() dto: AddToBasketDto,
  ) {
    return this.shopping.addToBasket(req.user.id, dto);
  }

  @Post('from-recipe')
  addFromRecipe(
    @Request() req: { user: { id: string } },
    @Body() dto: AddRecipeMissingDto,
  ) {
    return this.shopping.addRecipeMissing(
      req.user.id,
      dto.recipeId,
      dto.items,
    );
  }

  @Post('basket/:id/complete')
  complete(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.shopping.complete(req.user.id, id);
  }
}
