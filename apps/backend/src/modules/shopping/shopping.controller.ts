import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddShoppingFromRecipeDto } from './dto/add-shopping-from-recipe.dto';
import { AddShoppingItemDto } from './dto/add-shopping-item.dto';
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
    @Body() body: AddShoppingItemDto,
  ) {
    return this.shopping.addToBasket(req.user.id, body);
  }

  @Post('from-recipe')
  addFromRecipe(
    @Request() req: { user: { id: string } },
    @Body() body: AddShoppingFromRecipeDto,
  ) {
    return this.shopping.addRecipeMissing(
      req.user.id,
      body.recipeId,
      body.items ?? [],
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
