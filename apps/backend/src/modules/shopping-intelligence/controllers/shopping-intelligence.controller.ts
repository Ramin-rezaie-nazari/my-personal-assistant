import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateShoppingItemDto } from '../dto/create-shopping-item.dto';
import { ReorderShoppingItemDto } from '../dto/reorder-shopping-item.dto';
import { UpdateShoppingItemDto } from '../dto/update-shopping-item.dto';
import { ShoppingIntelligenceService } from '../services/shopping-intelligence.service';
import { ShoppingListPersistenceService } from '../services/shopping-list-persistence.service';

@Controller('shopping-intelligence')
@UseGuards(JwtAuthGuard)
export class ShoppingIntelligenceController {
  constructor(
    private readonly shoppingService: ShoppingIntelligenceService,
    private readonly shoppingList: ShoppingListPersistenceService,
  ) {}

  @Get()
  getShoppingPlan() {
    return this.shoppingService.createShoppingPlan();
  }

  @Get('list')
  list(
    @Request() req: { user: { id: string } },
    @Query('completed') completed?: string,
  ) {
    return this.shoppingList.list(req.user.id, completed === 'true');
  }

  @Post('list')
  add(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateShoppingItemDto,
  ) {
    return this.shoppingList.addOrMerge({ userId: req.user.id, ...dto });
  }

  @Patch('list/:id')
  update(
    @Request() req: { user: { id: string } },
    @Param('id') itemId: string,
    @Body() patch: UpdateShoppingItemDto,
  ) {
    return this.shoppingList.update(req.user.id, itemId, patch);
  }

  @Post('list/:id/complete')
  complete(
    @Request() req: { user: { id: string } },
    @Param('id') itemId: string,
  ) {
    return this.shoppingList.setCompleted(req.user.id, itemId, true);
  }

  @Post('list/:id/reopen')
  reopen(
    @Request() req: { user: { id: string } },
    @Param('id') itemId: string,
  ) {
    return this.shoppingList.setCompleted(req.user.id, itemId, false);
  }

  @Post('list/:id/reorder')
  reorder(
    @Request() req: { user: { id: string } },
    @Param('id') itemId: string,
    @Body() dto: ReorderShoppingItemDto,
  ) {
    return this.shoppingList.reorder(req.user.id, itemId, dto.sortOrder);
  }

  @Delete('list/:id')
  remove(
    @Request() req: { user: { id: string } },
    @Param('id') itemId: string,
  ) {
    return this.shoppingList.remove(req.user.id, itemId);
  }
}
