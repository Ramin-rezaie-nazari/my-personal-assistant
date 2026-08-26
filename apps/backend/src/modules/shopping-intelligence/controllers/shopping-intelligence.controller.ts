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
import { ShoppingPriceProviderService } from '../services/shopping-price-provider.service';
import { PersistentConsumptionForecastService } from '../services/persistent-consumption-forecast.service';
import { ShoppingGlobalContextService } from '../services/shopping-global-context.service';

@Controller('shopping-intelligence')
@UseGuards(JwtAuthGuard)
export class ShoppingIntelligenceController {
  constructor(
    private readonly shoppingService: ShoppingIntelligenceService,
    private readonly shoppingList: ShoppingListPersistenceService,
    private readonly priceProviders: ShoppingPriceProviderService,
    private readonly forecasts: PersistentConsumptionForecastService,
    private readonly globalContext: ShoppingGlobalContextService,
  ) {}

  @Get()
  getShoppingPlan() {
    return this.shoppingService.createShoppingPlan();
  }

  @Get('context')
  context(@Query('countryCode') countryCode = '', @Query('currency') currency?: string, @Query('locale') locale?: string, @Query('timezone') timezone?: string) {
    return this.globalContext.normalize({ countryCode, currency, locale, timezone });
  }

  @Get('price-providers')
  providers() {
    return this.priceProviders.listProviders();
  }

  @Get('forecast/:foodId')
  forecast(@Request() req: { user: { id: string } }, @Param('foodId') foodId: string) {
    return this.forecasts.forecast(req.user.id, foodId);
  }

  @Get('forecast')
  forecastAll(@Request() req: { user: { id: string } }) {
    return this.forecasts.forecastAll(req.user.id);
  }

  @Get('list')
  list(@Request() req: { user: { id: string } }, @Query('completed') completed?: string) {
    return this.shoppingList.list(req.user.id, completed === 'true');
  }

  @Post('list')
  add(@Request() req: { user: { id: string } }, @Body() dto: CreateShoppingItemDto) {
    return this.shoppingList.addOrMerge({ userId: req.user.id, ...dto });
  }

  @Patch('list/:id')
  update(@Request() req: { user: { id: string } }, @Param('id') itemId: string, @Body() patch: UpdateShoppingItemDto) {
    return this.shoppingList.update(req.user.id, itemId, patch);
  }

  @Post('list/:id/complete')
  complete(@Request() req: { user: { id: string } }, @Param('id') itemId: string) {
    return this.shoppingList.setCompleted(req.user.id, itemId, true);
  }

  @Post('list/:id/reopen')
  reopen(@Request() req: { user: { id: string } }, @Param('id') itemId: string) {
    return this.shoppingList.setCompleted(req.user.id, itemId, false);
  }

  @Post('list/:id/reorder')
  reorder(@Request() req: { user: { id: string } }, @Param('id') itemId: string, @Body() dto: ReorderShoppingItemDto) {
    return this.shoppingList.reorder(req.user.id, itemId, dto.sortOrder);
  }

  @Delete('list/:id')
  remove(@Request() req: { user: { id: string } }, @Param('id') itemId: string) {
    return this.shoppingList.remove(req.user.id, itemId);
  }
}
